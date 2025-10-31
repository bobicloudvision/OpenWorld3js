// Emoticon map - maps text emoticons to Unicode emojis or display strings
export const emoticonMap = {
  // Happy faces
  ':)': '😊',
  ':-)': '😊',
  ':]': '😊',
  ':-]': '😊',
  ':D': '😃',
  ':-D': '😃',
  ':3': '😊',
  ':-3': '😊',
  
  // Very happy
  ':))': '😄',
  ':-))': '😄',
  'xD': '😆',
  'XD': '😆',
  'x-D': '😆',
  'X-D': '😆',
  
  // Love
  '<3': '❤️',
  '</3': '💔',
  '<33': '💕',
  '<333': '💖',
  ':*)': '😘',
  ':*': '😘',
  
  // Wink
  ';)': '😉',
  ';-)': '😉',
  ';]': '😉',
  ';-]': '😉',
  
  // Tongue out
  ':P': '😛',
  ':-P': '😛',
  ':p': '😛',
  ':-p': '😛',
  ':b': '😛',
  ':-b': '😛',
  'XP': '😜',
  'xp': '😜',
  
  // Sad
  ':(': '😢',
  ':-(': '😢',
  ':[': '😢',
  ':-[': '😢',
  ':|': '😐',
  ':-|': '😐',
  
  // Very sad
  ':((': '😭',
  ':-((': '😭',
  ':((': '😭',
  'T.T': '😭',
  'T_T': '😭',
  
  // Surprised
  ':O': '😮',
  ':-O': '😮',
  ':o': '😮',
  ':-o': '😮',
  ':0': '😮',
  ':-0': '😮',
  'O_O': '😳',
  'o_O': '😳',
  'O.o': '😳',
  
  // Confused
  ':/': '😕',
  ':-/': '😕',
  ':\\': '😕',
  ':-\\': '😕',
  ':S': '😕',
  ':-S': '😕',
  
  // Cool
  'B)': '😎',
  'B-)': '😎',
  '8)': '😎',
  '8-)': '😎',
  '(cool)': '😎',
  
  // Other emotions
  '>:(': '😠',
  '>:-(': '😠',
  '>:((': '😡',
  '>:-((': '😡',
  
  // Sleepy
  '-_-': '😑',
  '-.-': '😑',
  'zZz': '😴',
  'zzz': '😴',
  
  // Shy
  ':$': '😳',
  ':-$': '😳',
  
  // Angel
  'O:)': '😇',
  'O:-)': '😇',
  
  // Devil
  '3:)': '😈',
  '3:-)': '😈',
  
  // Thumbs
  ':+1:': '👍',
  ':-1:': '👎',
  '(y)': '👍',
  '(n)': '👎',
  
  // Common gestures
  ':wave:': '👋',
  ':clap:': '👏',
  ':ok:': '👌',
  
  // Animals
  ':cat:': '🐱',
  ':dog:': '🐶',
  ':bear:': '🐻',
  ':panda:': '🐼',
  
  // Symbols
  ':star:': '⭐',
  ':fire:': '🔥',
  ':100:': '💯',
  ':rainbow:': '🌈',
}

// Function to parse emoticons in text
export function parseEmoticons(text) {
  if (!text || typeof text !== 'string') return text

  let parsedText = text
  const emoticonEntries = Object.entries(emoticonMap)
  
  // Sort by length (longest first) to avoid partial matches
  emoticonEntries.sort((a, b) => b[0].length - a[0].length)
  
  // Replace each emoticon
  emoticonEntries.forEach(([emoticon, emoji]) => {
    // Escape special regex characters in emoticon
    const escapedEmoticon = emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Use word boundaries for word-based emoticons (alphanumeric only), or exact match for symbol-based
    const isWordBased = /^[a-zA-Z0-9]+$/.test(emoticon)
    const regex = isWordBased 
      ? new RegExp(`\\b${escapedEmoticon}\\b`, 'gi')
      : new RegExp(escapedEmoticon, 'g')
    
    parsedText = parsedText.replace(regex, emoji)
  })
  
  return parsedText
}

// Function to get all available emoticons (for UI purposes)
export function getAvailableEmoticons() {
  return Object.entries(emoticonMap)
}

