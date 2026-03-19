<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { AboutCaptchaQuestion } from './types'

const props = defineProps<{
  open: boolean
  challenges: AboutCaptchaQuestion[]
}>()

const emit = defineEmits<{
  close: []
  verified: [challengeId: string]
}>()

const selectedTileIds = ref<string[]>([])
const currentIndex = ref(-1)
const checkboxLoading = ref(false)
const challengeVisible = ref(false)
const reloading = ref(false)
const verifying = ref(false)
const anchorVerified = ref(false)
const feedback = ref('')
const challengeVersion = ref(0)
const gridTransitionKey = ref(0)
const tileDisplayOrder = ref<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9])
const tileAnimationDelays = ref<number[]>(Array.from({ length: 9 }, () => 0))
const flowSessionId = ref(0)

const currentChallenge = computed(() => props.challenges[currentIndex.value] ?? props.challenges[0] ?? null)
const isSelectionCorrect = computed(() => {
  if (!currentChallenge.value) {
    return false
  }

  const actual = [...selectedTileIds.value].sort()
  const expected = tileDisplayOrder.value
    .map((sourcePosition, displayIndex) => (currentChallenge.value!.answerPositions.includes(sourcePosition) ? `tile-${displayIndex + 1}` : null))
    .filter((value): value is string => value !== null)
    .sort()
  return actual.length === expected.length && actual.every((value, index) => value === expected[index])
})

function shuffleTileDisplayOrder() {
  const nextOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  for (let index = nextOrder.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextOrder[index], nextOrder[swapIndex]] = [nextOrder[swapIndex], nextOrder[index]]
  }
  tileDisplayOrder.value = nextOrder
}

function tileIndex(row: number, column: number) {
  return (row - 1) * 3 + (column - 1)
}

function tileAt(row: number, column: number) {
  const displayPosition = tileIndex(row, column) + 1
  const sourcePosition = tileDisplayOrder.value[displayPosition - 1] ?? displayPosition
  return {
    id: `tile-${displayPosition}`,
    displayPosition,
    sourcePosition,
    alt: `${currentChallenge.value?.subject ?? ''} 拼图 ${sourcePosition}`,
  }
}

function compositeTileStyle(row: number, column: number) {
  const sourcePosition = tileAt(row, column).sourcePosition
  const sourceRow = Math.ceil(sourcePosition / 3)
  const sourceColumn = ((sourcePosition - 1) % 3) + 1
  return {
    backgroundImage: `url(${currentChallenge.value?.imageUrl ?? ''})`,
    backgroundSize: '300% 300%',
    backgroundPosition: `${(sourceColumn - 1) * 50}% ${(sourceRow - 1) * 50}%`,
  }
}

function tileAnimationStyle(row: number, column: number) {
  const delay = tileAnimationDelays.value[tileIndex(row, column)] ?? 0
  return {
    animationDelay: `${delay}ms`,
  }
}

function randomizeTileAnimationDelays() {
  const pool = [0, 45, 90, 120, 160, 210, 250, 300, 340]
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]]
  }
  tileAnimationDelays.value = pool
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function invalidateFlowSession() {
  flowSessionId.value += 1
}

function isFlowSessionActive(sessionId: number) {
  return props.open && flowSessionId.value === sessionId
}

function requestClose() {
  invalidateFlowSession()
  resetPanel()
  emit('close')
}

function resetPanel() {
  selectedTileIds.value = []
  currentIndex.value = -1
  checkboxLoading.value = false
  challengeVisible.value = false
  reloading.value = false
  verifying.value = false
  anchorVerified.value = false
  feedback.value = ''
  tileDisplayOrder.value = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  tileAnimationDelays.value = Array.from({ length: 9 }, () => 0)
}

function prepareChallengeState() {
  chooseNextChallenge()
  shuffleTileDisplayOrder()
  randomizeTileAnimationDelays()
  challengeVersion.value += 1
  gridTransitionKey.value += 1
  selectedTileIds.value = []
}

function chooseNextChallenge() {
  if (props.challenges.length === 0) {
    currentIndex.value = -1
    return
  }

  if (props.challenges.length === 1) {
    currentIndex.value = 0
    return
  }

  if (currentIndex.value < 0) {
    currentIndex.value = Math.floor(Math.random() * props.challenges.length)
    return
  }

  let nextIndex = currentIndex.value
  while (nextIndex === currentIndex.value) {
    nextIndex = Math.floor(Math.random() * props.challenges.length)
  }
  currentIndex.value = nextIndex
}

async function openChallenge() {
  if (checkboxLoading.value || verifying.value || anchorVerified.value) {
    return
  }

  const sessionId = flowSessionId.value
  checkboxLoading.value = true
  feedback.value = ''
  await delay(1000)
  if (!isFlowSessionActive(sessionId)) {
    return
  }
  prepareChallengeState()
  challengeVisible.value = true
  checkboxLoading.value = false
}

function toggleTile(tileId: string) {
  if (verifying.value || reloading.value) {
    return
  }

  if (selectedTileIds.value.includes(tileId)) {
    selectedTileIds.value = selectedTileIds.value.filter((id) => id !== tileId)
    return
  }

  selectedTileIds.value = [...selectedTileIds.value, tileId]
}

async function reloadChallenge() {
  const sessionId = flowSessionId.value
  selectedTileIds.value = []
  feedback.value = ''
  reloading.value = true
  await delay(220)
  if (!isFlowSessionActive(sessionId)) {
    return
  }
  prepareChallengeState()
  reloading.value = false
}

async function verifySelection() {
  if (!currentChallenge.value || verifying.value || reloading.value) {
    return
  }

  if (selectedTileIds.value.length === 0) {
    feedback.value = '先点几张图，不然这关过得太敷衍。'
    return
  }

  const sessionId = flowSessionId.value
  const challengeId = currentChallenge.value.id
  verifying.value = true
  feedback.value = ''
  await delay(2000)
  if (!isFlowSessionActive(sessionId)) {
    return
  }

  if (isSelectionCorrect.value) {
    challengeVisible.value = false
    selectedTileIds.value = []
    verifying.value = false
    checkboxLoading.value = true
    anchorVerified.value = false
    await delay(1000)
    if (!isFlowSessionActive(sessionId)) {
      return
    }
    checkboxLoading.value = false
    anchorVerified.value = true
    await delay(1000)
    if (!isFlowSessionActive(sessionId)) {
      return
    }
    emit('verified', challengeId)
    resetPanel()
    return
  }

  feedback.value = '请重试'
  await delay(900)
  if (!isFlowSessionActive(sessionId)) {
    return
  }
  feedback.value = ''
  selectedTileIds.value = []
  prepareChallengeState()
  verifying.value = false
}

watch(
  () => props.open,
  (value) => {
    invalidateFlowSession()
    resetPanel()

    if (!value) {
      return
    }
  },
  { immediate: true },
)
</script>

<template>
  <Transition name="modal-float" appear>
    <div v-if="open" class="modal-backdrop about-captcha-backdrop" @click.self="requestClose">
      <div class="about-captcha-shell">
        <div class="captcha-container about-captcha-widget">
          <div class="captcha-box">
            <div id="rc-anchor-container" class="rc-anchor rc-anchor-normal rc-anchor-light">
              <div id="recaptcha-accessible-status" class="rc-anchor-aria-status" aria-hidden="true">需要验证。</div>
              <div class="rc-anchor-error-msg-container">
                <span class="rc-anchor-error-msg" aria-hidden="true" />
              </div>
              <div class="rc-anchor-main-row">
                <div class="rc-anchor-content">
                  <div class="rc-inline-block rc-anchor-checkbox-hit" @click="openChallenge">
                    <div class="rc-anchor-center-container">
                      <div class="rc-anchor-center-item rc-anchor-checkbox-holder">
                        <span
                          id="recaptcha-anchor"
                          class="recaptcha-checkbox goog-inline-block rc-anchor-checkbox"
                          :class="{
                            'recaptcha-checkbox-unchecked': !anchorVerified,
                            'recaptcha-checkbox-checked': anchorVerified,
                            'rc-anchor-checkbox': true,
                          }"
                          role="checkbox"
                          :aria-checked="anchorVerified ? 'true' : 'false'"
                          tabindex="0"
                        >
                          <div v-show="!checkboxLoading" class="recaptcha-checkbox-border" role="presentation" />
                          <div class="recaptcha-checkbox-borderAnimation" role="presentation" :class="{ loading: checkboxLoading }" />
                          <div v-show="checkboxLoading" class="recaptcha-checkbox-spinner spinner" role="presentation">
                            <div class="recaptcha-checkbox-spinner-overlay" />
                          </div>
                          <div class="recaptcha-checkbox-checkmark" role="presentation" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="rc-anchor-copy-block">
                    <div class="rc-anchor-center-container rc-anchor-copy-container">
                      <label id="recaptcha-anchor-label" class="rc-anchor-center-item rc-anchor-checkbox-label" aria-hidden="true">
                        是人吗你？
                      </label>
                      <div class="rc-anchor-normal-footer">
                        <div class="rc-anchor-logo-portrait" aria-hidden="true" role="presentation">
                          <div class="rc-anchor-logo-img rc-anchor-logo-img-portrait" />
                          <div class="rc-anchor-logo-text">reCAPTCHA</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Transition name="captcha-layer-fade" appear>
        <div v-if="challengeVisible && currentChallenge" class="about-captcha-challenge-layer" @click.self="requestClose">
          <div class="captcha-selector about-captcha-selector">
            <div id="rc-imageselect">
              <div class="rc-imageselect-response-field" />
              <div class="rc-imageselect-payload">
                <div class="rc-imageselect-instructions">
                  <div class="rc-imageselect-desc-wrapper">
                    <div class="rc-imageselect-desc-no-canonical">
                      <span>请选择包含</span>
                      <Transition name="captcha-subject-fade" mode="out-in">
                        <strong :key="`${currentChallenge.subject}-${gridTransitionKey}`" class="object-name">{{ currentChallenge.subject }}</strong>
                      </Transition>
                      <span>的所有图片</span>
                    </div>
                  </div>
                  <div class="rc-imageselect-progress" />
                </div>

                <div class="rc-imageselect-challenge">
                  <Transition name="captcha-grid-fade" mode="out-in">
                    <div :key="gridTransitionKey" id="rc-imageselect-target" class="rc-imageselect-target" dir="ltr" role="presentation">
                      <table class="rc-imageselect-table-33">
                        <tbody>
                          <tr v-for="row in 3" :key="row">
                            <td
                              v-for="column in 3"
                              :key="`${row}-${column}`"
                              role="button"
                              tabindex="0"
                              class="rc-imageselect-tile"
                              :class="{ 'rc-imageselect-tileselected': selectedTileIds.includes(tileAt(row, column).id) }"
                              aria-label="图片验证"
                              @click="toggleTile(tileAt(row, column).id)"
                            >
                              <div class="rc-image-tile-target">
                                <div :style="tileAnimationStyle(row, column)" class="rc-image-tile-wrapper about-captcha-tile-wrapper captcha-tile-animate">
                                  <div class="about-captcha-tile-crop">
                                    <div class="about-captcha-tile-motion">
                                      <div class="about-captcha-tile-composite" :style="compositeTileStyle(row, column)" :aria-label="tileAt(row, column).alt" />
                                      <div class="rc-image-tile-overlay" />
                                    </div>
                                  </div>
                                </div>
                                <div class="rc-imageselect-checkbox" />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Transition>
                </div>

                <p v-if="feedback" class="about-captcha-feedback">{{ feedback }}</p>
              </div>

              <div class="rc-footer">
                <div class="rc-separator" />
                <div class="rc-controls">
                  <div class="primary-controls">
                    <div class="rc-buttons">
                      <div class="button-holder reload-button-holder">
                        <button
                          id="recaptcha-reload-button"
                          type="button"
                          class="rc-button goog-inline-block rc-button-reload"
                          title="换一个新的验证码"
                          :disabled="verifying || reloading"
                          @click="reloadChallenge"
                        />
                      </div>
                    </div>
                    <div class="verify-button-holder">
                        <button
                          id="recaptcha-verify-button"
                          type="button"
                          class="rc-button-default goog-inline-block"
                          :class="{ 'rc-button-default-disabled': verifying || reloading }"
                          :disabled="verifying || reloading"
                          @click="verifySelection"
                        >
                        {{ verifying ? '验证中' : '验证' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style>
@import '../../assets/captcha-ui/recaptcha.css';

.about-captcha-backdrop {
  z-index: 140;
  background: rgba(30, 22, 18, 0.36);
}

.about-captcha-shell {
  width: fit-content;
  min-height: 0;
}

.about-captcha-widget {
  position: relative;
  z-index: 1;
  user-select: none;
}

.about-captcha-widget,
.about-captcha-selector {
  font-family: inherit;
}

.about-captcha-widget .rc-anchor {
  display: flex;
  align-items: center;
  width: 276px;
  height: 72px;
  padding: 0;
  box-sizing: border-box;
  border-radius: 3px;
  overflow: visible;
}

.about-captcha-widget .rc-anchor-main-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 6px;
  box-sizing: border-box;
}

.about-captcha-widget .rc-anchor-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1 1 auto;
  height: 100%;
  min-width: 0;
}

.about-captcha-widget .rc-anchor-checkbox-hit {
  cursor: pointer;
}

.about-captcha-widget .rc-inline-block,
.about-captcha-widget .rc-anchor-center-container,
.about-captcha-widget .rc-anchor-center-item {
  height: auto;
}

.about-captcha-widget .rc-anchor-center-container {
  display: flex;
  align-items: center;
}

.about-captcha-widget .rc-anchor-copy-block {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  pointer-events: none;
}

.about-captcha-widget .rc-anchor-copy-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 48px;
}

.about-captcha-widget .rc-anchor-checkbox-holder,
.about-captcha-widget .rc-anchor-checkbox-label {
  display: flex;
  align-items: center;
}

.about-captcha-widget .rc-anchor-checkbox-holder {
  justify-content: center;
  width: 48px;
  height: 48px;
}

.about-captcha-widget .rc-anchor-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  margin: 0 0 0;
  vertical-align: middle;
  line-height: 0;
}

.about-captcha-widget .rc-anchor-checkbox-label {
  width: auto;
  margin: 0;
  font-family: inherit;
  font-size: 17px;
  line-height: 1;
  color: #000;
  white-space: nowrap;
}

.about-captcha-widget .rc-anchor-normal-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 48px;
  flex: 0 0 auto;
  pointer-events: none;
}

.about-captcha-widget .rc-anchor-logo-portrait {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 43px;
  min-width: 52px;
  margin: 0;
  line-height: 1;
}

.about-captcha-widget .rc-anchor-logo-img-portrait {
  flex: 0 0 auto;
}

.about-captcha-widget .rc-anchor-logo-text {
  font-family: inherit;
  margin: 0;
  line-height: 1;
  text-align: center;
}

.about-captcha-challenge-layer {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 141;
}

.about-captcha-selector {
  position: relative;
  width: 408px;
  visibility: visible;
  opacity: 1;
  z-index: 2;
  border-radius: 8px;
  overflow: hidden;
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.18),
    0 2px 8px rgba(0, 0, 0, 0.14);
}

.about-captcha-selector .rc-imageselect-desc-no-canonical span {
  display: block;
  font-size: 16px;
  line-height: 1.35;
  color: #fff;
}

.about-captcha-selector .object-name {
  display: block;
  font-size: 36px;
  line-height: 1.15;
  font-weight: 700;
  margin: 6px 0 4px;
  color: #fff;
}

.about-captcha-selector .rc-imageselect-instructions {
  min-height: 124px;
  height: auto;
  margin-bottom: 8px;
}

.about-captcha-selector .rc-imageselect-desc-wrapper {
  min-height: 124px;
  height: auto;
  box-sizing: border-box;
  padding: 18px 24px 12px;
  display: flex;
  align-items: flex-start;
  border-radius: 8px 8px 0 0;
}

.about-captcha-selector .rc-imageselect-desc-no-canonical {
  width: 100%;
  font-family: inherit;
}

.about-captcha-selector .rc-imageselect-desc-wrapper,
.about-captcha-selector .rc-imageselect-instructions,
.about-captcha-selector .rc-imageselect-instructions strong {
  font-family: inherit;
}

.about-captcha-selector .rc-imageselect-desc-wrapper * {
  color: #fff;
}

.about-captcha-selector .rc-imageselect-challenge,
.about-captcha-selector .rc-imageselect-target {
  display: flex;
  justify-content: center;
}

.about-captcha-tile-wrapper {
  position: relative;
  width: 126px;
  height: 126px;
  border-radius: 2px;
}

.about-captcha-tile-crop {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.about-captcha-tile-motion {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: center;
}

.about-captcha-tile-composite {
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.about-captcha-tile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: inherit;
}

.about-captcha-feedback {
  min-height: 20px;
  margin: 8px 7px 7px;
  font-size: 14px;
  line-height: 1.5;
  color: #d93025;
  text-align: center;
}

.recaptcha-checkbox-borderAnimation.loading {
  background-position: -28px -588px;
}

.recaptcha-checkbox-spinner.spinner {
  animation-play-state: running;
  opacity: 1;
  transform: scale(0);
}

.recaptcha-checkbox-spinner-overlay {
  animation-play-state: running;
}

.about-captcha-widget .recaptcha-checkbox-checkmark {
  top: 50%;
  left: 50%;
  opacity: 0;
  margin: 0;
  transform: translate(-50%, -50%) scale(0.72);
  transform-origin: center;
  transition: opacity 180ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.about-captcha-widget .recaptcha-checkbox-checked .recaptcha-checkbox-checkmark {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.about-captcha-selector .rc-imageselect-checkbox {
  display: none;
  pointer-events: none;
}

.about-captcha-selector .rc-imageselect-tileselected .about-captcha-tile-motion {
  transform: scale(0.82);
}

.about-captcha-selector .rc-imageselect-tileselected .rc-imageselect-checkbox {
  display: block;
  background-repeat: no-repeat;
  inset: 0;
}

.captcha-layer-fade-enter-active,
.captcha-layer-fade-leave-active {
  transition: opacity 140ms ease;
}

.captcha-layer-fade-enter-active .captcha-selector,
.captcha-layer-fade-leave-active .captcha-selector {
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

.captcha-layer-fade-enter-from,
.captcha-layer-fade-leave-to {
  opacity: 0;
}

.captcha-layer-fade-enter-from .captcha-selector,
.captcha-layer-fade-leave-to .captcha-selector {
  opacity: 0;
  transform: scale(0.985);
}

.captcha-grid-fade-enter-active,
.captcha-grid-fade-leave-active {
  transition: opacity 320ms ease;
}

.captcha-grid-fade-enter-from,
.captcha-grid-fade-leave-to {
  opacity: 0;
}

.captcha-subject-fade-enter-active,
.captcha-subject-fade-leave-active {
  transition: opacity 320ms ease;
}

.captcha-subject-fade-enter-from,
.captcha-subject-fade-leave-to {
  opacity: 0;
}

.captcha-tile-animate {
  animation: captcha-tile-fade-in 420ms ease both;
}

@keyframes captcha-tile-fade-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.about-captcha-selector .rc-footer {
  border-radius: 0 0 8px 8px;
}

.about-captcha-selector .rc-button-default {
  border-radius: 4px;
}

@media (max-width: 900px) {
  .about-captcha-selector {
    width: min(408px, calc(100vw - 48px));
  }

  .about-captcha-selector .rc-imageselect-table-33 {
    table-layout: fixed;
  }

  .about-captcha-selector .rc-imageselect-table-33 td {
    width: 33.3333%;
  }

  .about-captcha-tile-wrapper {
    width: 100%;
    height: auto;
    min-height: 0;
    aspect-ratio: 1 / 1;
  }
}
</style>
