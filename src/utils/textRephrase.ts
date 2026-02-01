/**
 * Rephrase and improve text using LanguageTool API
 * This is a free grammar checking service
 */
export const rephraseText = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) {
    return text
  }

  try {
    // Use LanguageTool API for grammar checking and suggestions
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        language: 'en-US',
      }),
    })

    if (!response.ok) {
      throw new Error('Grammar check failed')
    }

    const data = await response.json()
    let improvedText = text

    // Apply corrections from LanguageTool
    // Sort matches by offset in reverse order to apply from end to start
    const matches = data.matches || []
    const sortedMatches = [...matches].sort(
      (a, b) => (b.offset + b.length) - (a.offset + a.length)
    )

    for (const match of sortedMatches) {
      if (match.replacements && match.replacements.length > 0) {
        const replacement = match.replacements[0].value
        const start = match.offset
        const end = match.offset + match.length

        improvedText =
          improvedText.substring(0, start) +
          replacement +
          improvedText.substring(end)
      }
    }

    // If no corrections were found, try a simple improvement using basic rules
    if (improvedText === text && text.length > 0) {
      improvedText = improveTextBasic(text)
    }

    return improvedText
  } catch (error) {
    console.error('Error rephrasing text:', error)
    // Fallback to basic text improvement
    return improveTextBasic(text)
  }
}

/**
 * Basic text improvement using simple rules
 * This is a fallback when API is unavailable
 */
const improveTextBasic = (text: string): string => {
  let improved = text

  // Fix common issues
  // Capitalize first letter of sentences
  improved = improved.replace(
    /(^|[.!?]\s+)([a-z])/g,
    (_match, p1, p2) => p1 + p2.toUpperCase()
  )

  // Fix double spaces
  improved = improved.replace(/\s+/g, ' ')

  // Fix spacing around punctuation
  improved = improved.replace(/\s+([,.!?;:])/g, '$1')
  improved = improved.replace(/([,.!?;:])([^\s])/g, '$1 $2')

  // Fix "i" to "I"
  improved = improved.replace(/\bi\b/g, 'I')

  // Trim whitespace
  improved = improved.trim()

  return improved
}
