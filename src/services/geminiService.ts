import { LearningMaterial, LKPD } from '../types';

export async function generateMateriWithAi(
  topic: string,
  grade: number,
  subject: string
): Promise<Partial<LearningMaterial>> {
  try {
    const res = await fetch('/api/ai/generate-materi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, grade, subject }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('generateMateriWithAi error:', error);
    throw error;
  }
}

export async function generateLkpdWithAi(
  topic: string,
  grade: number,
  subject: string,
  learningGoal?: string
): Promise<Partial<LKPD>> {
  try {
    const res = await fetch('/api/ai/generate-lkpd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, grade, subject, learningGoal }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('generateLkpdWithAi error:', error);
    throw error;
  }
}

export async function chatWithSahabatIlmu(
  message: string,
  role: string,
  grade: number,
  topic?: string,
  history?: { role: string; content: string }[]
): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat-sahabat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, role, grade, topic, history }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const json = await res.json();
    return json.reply;
  } catch (error) {
    console.error('chatWithSahabatIlmu error:', error);
    return 'Halo Sahabat Hebat! Yuk kita pelajari bersama-sama konsep ini dengan riang dan semangat!';
  }
}
