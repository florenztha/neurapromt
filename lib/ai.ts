import { GoogleGenAI } from "@google/genai";

/**
 * Robust wrapper to handle AI generation by calling our internal server-side API.
 * This keeps API keys hidden and handles key rotation on the server.
 */
export async function smartGenerateContent(params: {
  preferredModel: string;
  fallbackModels: string[];
  contents: any;
  config?: any;
}) {
  // If the model is a Gemini model, we can call it directly from the client as per guidelines
  if (params.preferredModel.startsWith('gemini-')) {
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: params.preferredModel,
      contents: params.contents,
      config: params.config
    });
    return {
      text: response.text,
      model: params.preferredModel
    };
  }

  // Convert input contents to Groq-style messages
  let messages: any[] = [];
  
  if (params.config?.systemInstruction) {
    messages.push({ role: 'system', content: params.config.systemInstruction });
  }

  if (typeof params.contents === 'string') {
    messages.push({ role: 'user', content: params.contents });
  } else if (params.contents.parts) {
    const contentParts: any[] = [];
    params.contents.parts.forEach((p: any) => {
      if (p.text) {
        contentParts.push({ type: 'text', text: p.text });
      } else if (p.inlineData) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`
          }
        });
      }
    });
    messages.push({ role: 'user', content: contentParts });
  }

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: params.preferredModel || 'llama-3.3-70b-versatile',
        jsonMode: params.config?.responseMimeType === 'application/json',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      if (data.error.toLowerCase().includes('max tokens limit')) {
        throw new Error('The image or prompt is too large for the AI to process. Please try a smaller image or a shorter description.');
      }
      throw new Error(data.error);
    }
    return {
      text: data.text,
      model: data.model,
    };
  } catch (error: any) {
    console.error('Error in smartGenerateContent:', error);
    throw error;
  }
}

/**
 * Robust chat wrapper to handle AI generation by calling our internal server-side API.
 */
export async function smartChat(params: {
  preferredModel: string;
  fallbackModels: string[];
  message: string;
  history?: any[];
  config?: any;
}) {
  const messages: any[] = [];

  if (params.config?.systemInstruction) {
    messages.push({ role: 'system', content: params.config.systemInstruction });
  }

  if (params.history) {
    params.history.forEach((h: any) => {
      messages.push({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text,
      });
    });
  }

  messages.push({ role: 'user', content: params.message });

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: params.preferredModel || 'llama-3.3-70b-versatile',
        jsonMode: params.config?.responseMimeType === 'application/json',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.text,
      model: data.model,
    };
  } catch (error: any) {
    console.error('Error in smartChat:', error);
    throw error;
  }
}

export const generatePrompt = async (toolId: string, inputs: any, globalLanguage: string = 'English') => {
  const dualOutputTools = [
    'content-suite', 
    'meta-llm', 
    'text-to-image', 
    'image-editor', 
    'image-extractor', 
    'video-extractor',
    'text-to-video'
  ];
  const isDualOutput = dualOutputTools.includes(toolId);
  
  // Prepare media data if present
  let mediaPart: any = null;
  const promptInputs = { ...inputs };

  // Strip base64 from inputs to prevent 400 errors (token limit)
  if (promptInputs.image && typeof promptInputs.image === 'string' && promptInputs.image.startsWith('data:')) {
    const [mimePart, base64Data] = promptInputs.image.split(',');
    const mimeType = mimePart.split(':')[1].split(';')[0];
    mediaPart = {
      inlineData: {
        mimeType,
        data: base64Data
      }
    };
    promptInputs.image = "[User Uploaded Image]";
  }
  
  if (promptInputs.video && typeof promptInputs.video === 'string' && promptInputs.video.startsWith('data:')) {
    const [mimePart, base64Data] = promptInputs.video.split(',');
    const mimeType = mimePart.split(':')[1].split(';')[0];
    mediaPart = {
      inlineData: {
        mimeType,
        data: base64Data
      }
    };
    promptInputs.video = "[User Uploaded Video]";
  }

  // Prepare roles for text-to-video
  let roleToAssume = 'Professional Film Director';
  if (toolId === 'text-to-video') {
    const selectedRoles = [
      ...(Array.isArray(inputs.role_cinematography) ? inputs.role_cinematography : []),
      ...(Array.isArray(inputs.role_modern) ? inputs.role_modern : []),
      ...(Array.isArray(inputs.role_artistic) ? inputs.role_artistic : [])
    ];
    if (selectedRoles.length > 0) {
      roleToAssume = selectedRoles.join(', ');
    }
  }

  const systemInstructions = `
    You are an expert Prompt Engineer at Neura Generator Ai.
    Generate professional AI prompts and results based on inputs.
    
    Tool ID: ${toolId}
    Inputs: ${JSON.stringify(promptInputs)}
    
    RULES:
    - LANGUAGE: ${globalLanguage}.
    - Be direct and professional.
    - Readability: Grade 6–8.
    
    ${toolId === 'text-to-video' ? `
    For this tool, you MUST follow this EXACT format for the "prompt" field:
    [GENRE VIDEO] + [GERAKAN KAMERA] + [RASIO ASPEK] + [FOKUS KAMERA] + [FOKUS EMOSI] + [PENCAHAYAAN] + [DETAIL TEKSTUR] + [VARIASI CUACA] + [DURASI VIDEO] + [SOUND DESIGN]
    Deskripsi Adegan Utama: ${inputs.description}

    Role to assume: ${roleToAssume}

    Instructions:
    - Genre: ${inputs.genre}
    - Motion: ${inputs.motion}
    - Aspect Ratio: ${inputs.aspect_ratio}
    - Focus: ${inputs.focus}
    - Emotion: ${inputs.emotion}
    - Lighting: ${inputs.lighting}
    - Texture: ${inputs.texture}
    - Weather: ${inputs.weather}
    - Duration: ${inputs.duration}
    - Sound: ${inputs.sound}

    The "result" field should contain a detailed cinematic breakdown including:
    - Role Information
    - Scene Breakdown
    - Technical Specifications
    - Visual Vibe Description
    ` : ''}

    ${toolId === 'content-suite' || toolId === 'meta-llm' ? `
    For this tool, you MUST generate the FINAL, FINISHED content in the "result" field. 
    - Do NOT just give a strategy or a prompt.
    - Give the actual article, post, or analysis that the user can use immediately.
    - If Tool is "meta-llm", act as the target platform (${inputs.platform}) and provide the final response to the keywords/goal.
    - If Tool is "content-suite", follow the Objective:
      - Objective "Jawaban": Provide a direct, clear, and comprehensive answer.
      - Objective "Analisa": Provide a deep, data-driven analysis.
      - Objective "Alasan": Provide logical reasons/justifications.
      - Objective "Visi & Misi": Craft a compelling vision/mission.
      - Objective "Kesimpulan": Provide a final verdict.
      - Objective "Ringkasan": Provide a high-level summary.
    ` : ''}

    ${toolId === 'text-to-image' ? `
    For this tool, you MUST follow this EXACT structure for your output:

    ROLE
    You are an expert AI Visual Director, Art Director, UI Designer, Photographer, and Digital Artist capable of generating professional visual outputs across all artistic styles.

    GOAL
    Generate high-quality images from text prompts with cinematic composition, professional lighting, and consistent visual storytelling.

    IMAGE TITLE
    [AI: Generate a creative title based on inputs]

    CORE CONCEPT
    [AI: Describe the main idea or visual message]

    IMAGE CATEGORY
    [AI: Choose one: cinematic scene, portrait, product photography, concept art, illustration, fashion editorial, architecture, fantasy artwork, sci-fi environment, advertising visual, social media artwork, UI design, logo concept]
    Input Category: ${inputs.category}

    SUBJECT
    Describe main subject.
    - identity: [AI: Generate based on subject input]
    - appearance: [AI: Generate based on style/subject]
    - pose: [AI: Generate based on mood/subject]
    - emotion: [AI: Generate based on mood]
    - interaction: [AI: Generate if applicable]
    Input Subject: ${inputs.subject}

    ENVIRONMENT
    Scene setting.
    - location: [AI: Generate based on subject/style]
    - time of day: [AI: Generate based on lighting/mood]
    - weather: [AI: Generate if applicable]
    - atmosphere: [AI: Generate based on mood]
    - background elements: [AI: Generate]

    COMPOSITION
    Visual arrangement.
    [AI: Choose one: rule of thirds, centered composition, cinematic framing, minimal composition, dynamic perspective]
    Input Composition: ${inputs.composition}

    CAMERA LANGUAGE
    [AI: Choose one: wide shot, close-up, macro shot, low angle, high angle, drone view, portrait lens, depth of field, bokeh background]
    Input Camera: ${inputs.camera}

    LIGHTING DESIGN
    [AI: Choose one: soft natural light, studio lighting, cinematic lighting, golden hour, neon light, dramatic shadows, rim light, volumetric light]
    Input Lighting: ${inputs.lighting}

    VISUAL STYLE
    Choose artistic direction.
    [AI: Choose one: photorealistic, hyperrealistic, anime style, oil painting, watercolor, digital illustration, cinematic realism, 3D render, cyberpunk, minimalist design]
    Input Style: ${inputs.style}

    COLOR DESIGN
    [AI: Choose one: warm tone, pastel palette, vibrant colors, monochrome, teal & orange cinematic, moody contrast]
    Input Color: ${inputs.color}

    DETAIL & QUALITY
    ultra detailed, masterpiece, sharp focus, high dynamic range, realistic texture, professional quality, 8k resolution

    MOOD & STORY
    Describe emotional impact.
    [AI: Generate based on mood input]
    Input Mood: ${inputs.mood}

    MOTION / REALISM (Optional)
    natural movement, wind interaction, realistic physics, environmental motion

    NEGATIVE ELEMENTS
    blurry, low quality, bad anatomy, distortion, extra limbs, watermark, text artifacts

    TECHNICAL PARAMETERS (Optional AI settings)
    aspect ratio, resolution, sampling steps, CFG scale, seed

    OUTPUT
    Generate a complete optimized text-to-image prompt ready for AI image generation.

    JSON OUTPUT INSTRUCTIONS:
    - "prompt": Put ONLY the complete optimized text-to-image prompt here.
    - "result": Put the FULL structured breakdown (ROLE, GOAL, IMAGE TITLE, etc.) here.
    ` : ''}

    ${toolId === 'shorts-factory' ? `
    Peran AI: Konten Generate (User-Generated Content Specialist).
    Tujuan: Membuat kreasi User Generated Content (UGC) di mana model mereview produk secara realistis untuk iklan.
    
    ASPEK TEKNIS:
    - Ukuran Input: 3:4
    - Ukuran Output: 3:4
    - Jumlah Gambar: Hasilkan 2 variasi gambar utama yang sangat realistis.

    INPUT DATA:
    - Foto Produk: ${inputs.productImage}
    - Foto Model/Wajah: ${inputs.modelImage}
    - Nama Produk: ${inputs.productName}
    - Background: ${inputs.background}
    - Tone/Gaya Bahasa: ${inputs.tone}
    - Platform: ${inputs.platform}

    STRUKTUR OUTPUT DETAIL:

    1. FITUR 1 (UGC KONTEN - HUMAN CENTRIC)
    - Deskripsi: Karakter/model (menggunakan wajah dari ${inputs.modelImage}) sedang memegang/mereview ${inputs.productName}.
    - Suasana: Background diatur menjadi ${inputs.background}.
    - Gaya Bahasa: Menggunakan tone ${inputs.tone}.
    - Prompt Image Generation: Berikan prompt detail untuk menghasilkan gambar model mereview produk dengan rasio 3:4.

    2. FITUR 2 (POV - HANDS ONLY)
    - Deskripsi: Konten tanpa wajah, hanya terlihat tangan sedang unboxing atau mereview ${inputs.productName}.
    - Suasana: Background diatur menjadi ${inputs.background}.
    - Prompt Image Generation: Berikan prompt detail untuk shot POV tangan dengan rasio 3:4.

    3. FITUR 3 (STORYBOARD REALISTIS & SINCRON)
    - Buat alur cerita 4-Frame yang realistis dan saling menyambung secara visual (iklan style):
      - FRAME 1 (HOOK PROBLEM): Visualisasi masalah yang dipecahkan produk. Deskripsi visual detail + Script Voiceover (Tone: ${inputs.tone}).
      - FRAME 2 (SOLUTION): Memperkenalkan ${inputs.productName} dengan transisi smooth. Deskripsi visual detail + Script Voiceover.
      - FRAME 3 (BENEFIT): Menunjukkan hasil/manfaat pemakaian secara nyata. Deskripsi visual detail + Script Voiceover.
      - FRAME 4 (CTA): Ajakan bertindak yang persuasif dengan visual produk. Deskripsi visual detail + Script Voiceover.
    - Sinkronisasi Suara: Pastikan durasi script voiceover sinkron dengan transisi visual yang diusulkan.

    4. FITUR 4 (CAPTION & HASHTAG OTOMATIS)
    - Generate Caption yang menarik (Hook-driven) sesuai platform ${inputs.platform}.
    - Generate Hashtag yang mengikuti update algoritma terbaru.
    
    CATATAN: Optimalkan AI untuk membuat gambar yang terlihat seperti iklan profesional. Pastikan logo pada produk "${inputs.productName}" tetap terlihat jelas dan tidak distorted.
    ` : ''}

    ${toolId === 'film-generator' ? `
    For this tool, you MUST follow this EXACT structure for your output:
    
    ROLE:
    You are an award-winning Film Director, Cinematographer, and Visual Storytelling Expert.

    GOAL:
    Create a cinematic AI film sequence.

    -----------------------------------

    FILM TITLE:
    ${inputs.title || '[Untitled Film]'}

    CORE IDEA:
    ${inputs.concept || '[No concept provided]'}

    FILM GENRE:
    ${inputs.genre || 'cinematic drama'}

    -----------------------------------

    STORY STRUCTURE

    ACT 1 — OPENING
    Introduce environment and mood.
    [AI: Generate detailed description here]

    ACT 2 — DEVELOPMENT
    Character action or emotional progression.
    [AI: Generate detailed description here]

    ACT 3 — CLIMAX / RESOLUTION
    Strong cinematic ending shot.
    [AI: Generate detailed description here]

    -----------------------------------

    SHOT LIST (SCENE-BY-SCENE BREAKDOWN)
    [AI: Break down the story into exactly ${inputs.shotCount || '5-8'} specific cinematic shots. For each shot, specify:
    - Shot Number
    - Camera Angle & Movement
    - Subject Action & Composition
    - Lighting & Visual Vibe]

    -----------------------------------

    CHARACTER
    - identity: ${inputs.character || '[AI to generate based on concept]'}
    - appearance: [AI to generate]
    - emotion: [AI to generate]
    - action: [AI to generate]

    -----------------------------------

    ENVIRONMENT
    ${inputs.environment || 'location, time of day, weather, atmosphere details.'}
    [AI: Generate detailed description here]

    -----------------------------------

    CAMERA LANGUAGE
    cinematic wide shot / close-up emotion shot / tracking shot / slow dolly-in / drone reveal / handheld realism / depth of field control.
    [AI: Select and describe one]

    -----------------------------------

    LIGHTING DESIGN
    golden hour / soft natural light / dramatic shadow / neon cinematic / volumetric light rays.
    [AI: Select and describe one]

    -----------------------------------

    VISUAL STYLE
    film realism, Hollywood cinematic look, high dynamic range, film grain texture.
    [AI: Describe the style]

    -----------------------------------

    COLOR GRADING
    teal & orange cinematic, warm film tone, moody contrast, Netflix-style grading.
    [AI: Select and describe one]

    -----------------------------------

    MOTION & DETAIL
    natural body movement, wind interaction, environment motion, realistic physics.
    [AI: Describe the motion]

    -----------------------------------

    SOUND CONCEPT
    background score mood, ambient environment sound, cinematic impact moments.
    [AI: Describe the sound]

    -----------------------------------

    EDITING STYLE
    slow cinematic pacing, motivated cuts, smooth transitions, film storytelling rhythm.
    [AI: Describe the editing style]

    -----------------------------------

    OUTPUT:
    Generate a detailed cinematic film prompt ready for AI video generation.
    ` : ''}
    ${toolId === 'image-editor' ? `
    For this tool, the "prompt" field MUST follow this EXACT structure:
    ROLE
    You are an advanced AI Image Editor capable of modifying uploaded images with professional visual accuracy.

    INPUT SOURCE
    🖼️ IMAGE INPUT
    [User Uploaded Image]

    OPTIONAL REFERENCE IMAGE
    [AI: Mention if a style reference is implied or needed]

    EDIT INSTRUCTION
    Input Changes: ${inputs.changes}

    EDIT MODE
    [AI: Choose one based on input: enhancement, inpainting, outpainting, relighting, recolor, retouch, style transfer, object replace]
    Input Mode: ${inputs.mode}

    PRESERVATION RULES
    Maintain: identity, pose, perspective, proportions, realism.

    VISUAL ADJUSTMENTS
    Lighting: [AI: Choose one: exposure correction, cinematic lighting, shadow balance]
    Input Lighting: ${inputs.lighting}

    Color: [AI: Choose one: color grading, tone adjustment, white balance]
    Input Grading: ${inputs.grading}

    Detail: [AI: Choose one: sharpen, denoise, texture recovery]

    STYLE CONTROL (OPTIONAL)
    [AI: Choose one: photorealistic, cinematic, fashion editorial, anime style, luxury commercial]
    Input Style: ${inputs.style}

    NEGATIVE CONSTRAINTS
    avoid distortion, artifacts, warped face, fake texture, watermark, text errors

    OUTPUT
    Generate edited image while preserving realism and visual coherence.
    ` : ''}

    ${toolId === 'image-extractor' ? `
    For this tool, you are an expert at Reverse Prompt Engineering.
    Analyze the provided image (if any) or description.
    Your goal is to deconstruct the image into a master prompt that could reproduce a similar visual result.
    Break down the subject, style, lighting, composition, and technical parameters.
    ` : ''}

    ${toolId === 'video-extractor' ? `
    For this tool, you are an expert Cinematographer and AI Video Strategist.
    Analyze the provided video (if any) or description.
    Deconstruct the scene into a master prompt for AI video generation.
    Identify camera movements, lighting transitions, subject actions, and atmospheric details.
    ` : ''}

    ${isDualOutput ? `
    For this specific tool, you MUST return a JSON object with two fields:
    1. "prompt": The professional Master Prompt (The actual prompt that would be sent to an AI model to get the result).
    2. "result": The actual generated content/output based on that prompt.
    
    Use the following JSON schema:
    {
      "prompt": "string (markdown formatted)",
      "result": "string (markdown formatted)"
    }
    ` : `
    Return the response in a structured format suitable for the specific tool.
    Always include:
    1. The Main Super Prompt (The actual prompt to copy-paste into an AI like ChatGPT, Midjourney, etc.)
    2. Strategic Notes (Why this prompt works)
    3. Optimization Tips
    4. Variations (if applicable)
    `}
  `;

  const contents: any = {
    parts: [{ text: "Generate a professional prompt and its result based on the provided inputs." }]
  };

  if (mediaPart) {
    contents.parts.push(mediaPart);
  }

  const response = await smartGenerateContent({
    preferredModel: mediaPart ? "gemini-3-flash-preview" : "llama-3.3-70b-versatile",
    fallbackModels: [],
    contents: contents,
    config: {
      systemInstruction: systemInstructions,
      temperature: 0.5,
      responseMimeType: isDualOutput ? "application/json" : undefined,
    }
  });

  return response.text;
};

export const generateImage = async (prompt: string, baseImage?: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
    
    const contents: any = {
      parts: [{ text: prompt }]
    };

    if (baseImage && baseImage.startsWith('data:')) {
      const [mimePart, base64Data] = baseImage.split(',');
      const mimeType = mimePart.split(':')[1].split(';')[0];
      contents.parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};
