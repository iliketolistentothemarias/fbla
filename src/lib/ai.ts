import OpenAI from 'openai'
import { Message } from '../types'

export async function callAI(system: string, messages: Message[]): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not set. Please add VITE_OPENAI_API_KEY to your .env file.')
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  })

  const aiMessages = [
    { role: 'system', content: system },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ]

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: aiMessages as any,
    max_tokens: 1000
  })

  return response.choices[0]?.message?.content || ''
}
