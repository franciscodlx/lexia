import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'

/**
 * Lets the user pick a square photo and uploads it to `avatars/<uid>/avatar-<ts>.jpg`.
 * Returns the public URL, or null if the user cancelled.
 */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  })
  if (picked.canceled || !picked.assets[0]) return null

  const asset = picked.assets[0]
  const contentType = asset.mimeType ?? 'image/jpeg'
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
  const body = await (await fetch(asset.uri)).arrayBuffer()
  // New file name each time so CDN/image caches never show the old photo
  const path = `${userId}/avatar-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('avatars').upload(path, body, { contentType, upsert: true })
  if (error) throw error

  // Best effort: remove older avatars of this user
  const { data: files } = await supabase.storage.from('avatars').list(userId)
  const stale = (files ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== path)
  if (stale.length) await supabase.storage.from('avatars').remove(stale)

  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
