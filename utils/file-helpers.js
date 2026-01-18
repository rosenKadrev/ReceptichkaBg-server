const supabase = require('../supabase');

const uploadImage = async (file, userId) => {
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('receptichka_bg')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new Error('Error uploading avatar to storage.');
  }

  const { data: urlData } = supabase.storage
    .from('receptichka_bg')
    .getPublicUrl(fileName);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Could not retrieve public URL for avatar.');
  }

  return urlData.publicUrl;
};

const deleteImage = async (oldAvatarUrl) => {
  if (!oldAvatarUrl) {
    return;
  }

  try {
    const urlParts = oldAvatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName) {
      return;
    }

    await supabase.storage.from('receptichka_bg').remove([fileName]);
  } catch (error) {
    console.error('Error deleting old avatar:', error.message);
  }
};

module.exports = { uploadImage, deleteImage };
