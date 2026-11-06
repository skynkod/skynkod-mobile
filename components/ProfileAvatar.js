import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LevelEmblem } from './Badge'
import { GFW } from './glossy'

// The profile circle with the level emblem pinned to its corner, like a game
// avatar. Same look on Home and on the Profile page.
export default function ProfileAvatar({ name, level, size = 40, color, textColor, background }) {
  const emblem = Math.round(size * 0.62)
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: background || color }]}>
        {name ? <Text style={{ color: textColor, ...GFW('800'), fontSize: size * 0.38 }}>{name[0].toUpperCase()}</Text> : <Ionicons name="person" size={size * 0.42} color={textColor} />}
      </View>
      {level ? (
        <View style={[styles.emblem, { right: -emblem * 0.32, bottom: -emblem * 0.28 }]} pointerEvents="none">
          <LevelEmblem level={level} size={emblem} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  emblem: { position: 'absolute' },
})
