import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { supabase } from './supabase'

// Products users propose after scanning a barcode Skynkod doesn't know. They
// wait in product_submissions until an admin accepts them: nothing reaches the
// catalogue on its own. Photos (front, ingredient list) are optional.

// Sends the barcode; proposing the same barcode twice keeps the first one.
export const proposeProduct = async ({ userId, barcode, suggestion }) => {
  const { data, error } = await supabase
    .from('product_submissions')
    .insert({ barcode, suggestion: suggestion || null })
    .select('id')
    .single()
  if (!error) return data.id
  if (error.code !== '23505') throw error
  const { data: mine, error: findError } = await supabase.from('product_submissions').select('id').eq('user_id', userId).eq('barcode', barcode).maybeSingle()
  if (findError) throw findError
  return mine?.id
}

// Opens the camera; returns a small JPEG ready to upload, or null if cancelled.
export const takeProductPhoto = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync()
  if (!permission.granted) return { denied: true }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
  if (result.canceled || !result.assets?.length) return null
  const context = ImageManipulator.manipulate(result.assets[0].uri)
  context.resize({ width: 1200 })
  const image = await context.renderAsync()
  return image.saveAsync({ format: SaveFormat.JPEG, compress: 0.75 })
}

// Uploads the photos she took and attaches them to her proposal.
export const addProposalPhotos = async (userId, submissionId, { front, back }) => {
  const upload = async (photo, side) => {
    if (!photo?.uri) return null
    const body = await (await globalThis.fetch(photo.uri)).arrayBuffer()
    const path = `${userId}/${submissionId}-${side}.jpg`
    const { error } = await supabase.storage.from('submissions').upload(path, body, { contentType: 'image/jpeg', upsert: true })
    if (error) throw error
    return path
  }
  const [frontPath, backPath] = await Promise.all([upload(front, 'front'), upload(back, 'back')])
  if (!frontPath && !backPath) return
  const { error } = await supabase.rpc('update_my_submission', { p_id: submissionId, p_front: frontPath, p_back: backPath })
  if (error) throw error
}

// Her accepted proposals (for the journey points and badge).
export const getAcceptedContributions = async (userId) => {
  const { data, error } = await supabase
    .from('product_submissions')
    .select('id, reviewed_at, thanked_at, draft')
    .eq('user_id', userId)
    .eq('status', 'accepted')
  if (error) throw error
  return data || []
}

// Accepted since the app last thanked her; marking them shown happens once.
export const takeNewThanks = async (userId) => {
  const fresh = (await getAcceptedContributions(userId)).filter(s => !s.thanked_at)
  if (!fresh.length) return []
  const { error } = await supabase.rpc('mark_submissions_thanked', { p_ids: fresh.map(s => s.id) })
  if (error) throw error
  return fresh
}

// ---------- Admin ----------

export const isAdmin = async () => {
  const { data, error } = await supabase.rpc('is_skynkod_admin')
  if (error) return false
  return !!data
}

// Proposals waiting for a decision, the most requested barcodes first.
export const getProposalsToReview = async () => {
  const { data, error } = await supabase
    .from('product_submissions')
    .select('*')
    .in('status', ['pending', 'ready'])
    .order('created_at', { ascending: true })
  if (error) throw error
  const byBarcode = {}
  for (const s of data || []) {
    const key = s.barcode.replace(/^0+/, '')
    byBarcode[key] = byBarcode[key] || { ...s, people: 0, photos: [] }
    const group = byBarcode[key]
    group.people += 1
    if (s.status === 'ready' && group.status !== 'ready') Object.assign(group, { id: s.id, status: s.status, draft: s.draft })
    for (const path of [s.front_path, s.back_path]) if (path) group.photos.push(path)
  }
  const groups = Object.values(byBarcode).sort((a, b) => (b.status === 'ready') - (a.status === 'ready') || b.people - a.people)
  const paths = groups.flatMap(g => g.photos)
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('submissions').createSignedUrls(paths, 60 * 60)
    const urls = Object.fromEntries((signed || []).map(x => [x.path, x.signedUrl]))
    for (const g of groups) g.photoUrls = g.photos.map(p => urls[p]).filter(Boolean)
  }
  return groups
}

export const acceptProposal = async (id) => {
  const { data, error } = await supabase.rpc('accept_submission', { p_id: id })
  if (error) throw error
  return data
}

export const rejectProposal = async (id, note) => {
  const { error } = await supabase.rpc('reject_submission', { p_id: id, p_note: note || null })
  if (error) throw error
}
