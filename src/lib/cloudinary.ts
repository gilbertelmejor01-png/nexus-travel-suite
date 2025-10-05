// Servicio para subir imágenes a Cloudinary

// Configuración de Cloudinary
const cloudName = import.meta.env.CLUDINARY_NAME || "dckcnx0sz";

// Función para subir imagen a Cloudinary
export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    console.log("Iniciando subida a Cloudinary...", { 
      cloudName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Usamos un upload preset sin firma
    const uploadPreset = "flowmatic_logos";
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('cloud_name', cloudName);

    console.log("Enviando solicitud a Cloudinary con preset:", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log("Respuesta de Cloudinary:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
        console.error("Detalles del error Cloudinary:", errorData);
      } catch (e) {
        const errorText = await response.text();
        console.error("Error texto:", errorText);
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Subida exitosa a Cloudinary:", {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format
    });
    
    return data.secure_url;
  } catch (error) {
    console.error('Error completo subiendo a Cloudinary:', error);
    throw error;
  }
};

// Función de respaldo: si Cloudinary falla, convertir a base64
export const uploadImageWithFallback = async (file: File): Promise<string> => {
  try {
    console.log("Intentando subir a Cloudinary...");
    const cloudinaryUrl = await uploadToCloudinary(file);
    return cloudinaryUrl;
  } catch (cloudinaryError) {
    console.warn('Cloudinary falló, usando base64 como respaldo:', cloudinaryError);
    
    // Fallback a base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target?.result as string;
        console.log("Usando base64 como respaldo, tamaño:", dataURL.length);
        resolve(dataURL);
      };
      reader.onerror = (error) => {
        console.error("Error leyendo archivo como base64:", error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }
};

// Función para verificar si una URL es de Cloudinary
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com') || url.startsWith('http');
};
