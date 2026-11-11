import { registerPlugin, Capacitor } from '@capacitor/core';

export const Gallery = registerPlugin('Gallery');
export const isAndroidGalleryAvailable = () => Capacitor.getPlatform() === 'android';
