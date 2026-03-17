import luluGridImage from '../assets/about-captcha/lulu-grid.webp'

import type { AboutCaptchaQuestion } from '../components/about/types'

export const aboutCaptchaChallenges: AboutCaptchaQuestion[] = [
  {
    id: 'lulu',
    subject: '驴驴',
    answerPositions: [3, 4, 6, 9],
    imageUrl: luluGridImage,
  },
]
