import luluGridImage from '../assets/about-captcha/lulu-grid.webp'

import type { AboutCaptchaQuestion } from '../components/about/types'

export const aboutCaptchaChallenges: AboutCaptchaQuestion[] = [
  {
    id: 'lulu',
    subject: '驴驴',
    answerPositions: [3, 4, 6, 9],
    imageUrl: luluGridImage,
  },{
    id: 'yzx',
    subject: '湖北大学第三十二届 “十佳大学生” 称号获得者',
    answerPositions: [1],
    imageUrl: luluGridImage,
  },{
    id: 'pig',
    subject: '🐷',
    answerPositions: [2,7],
    imageUrl: luluGridImage,
  },
]
