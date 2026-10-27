import React from 'react'
import ProfileChapterScreen from './ProfileChapterScreen'

// "+ New skin issue" from the journal and "My skin issues" (Lita, 2026-10-27):
// the same photo cards as the sign-up, face, eyes, lips and neck, already filled in.
export default function SkinIssuesScreen(props) {
  return <ProfileChapterScreen {...props} route={{ ...props.route, params: { ...props.route?.params, chapters: ['face', 'eyes', 'lips', 'neck'] } }} />
}
