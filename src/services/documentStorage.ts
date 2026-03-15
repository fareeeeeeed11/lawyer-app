import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export const documentStorage = {
  async saveFile(file: File): Promise<string> {
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const fileName = `${Date.now()}_${file.name}`;
    
    await Filesystem.writeFile({
      path: `documents/${fileName}`,
      data: base64Data,
      directory: Directory.Data,
      recursive: true
    });

    return fileName;
  },

  async getFileUri(fileName: string): Promise<string> {
    const result = await Filesystem.getUri({
      path: `documents/${fileName}`,
      directory: Directory.Data
    });
    return result.uri;
  },

  async deleteFile(fileName: string): Promise<void> {
    await Filesystem.deleteFile({
      path: `documents/${fileName}`,
      directory: Directory.Data
    });
  }
};
