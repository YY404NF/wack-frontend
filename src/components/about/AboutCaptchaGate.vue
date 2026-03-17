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
const currentIndex = ref(0)
const checkboxLoading = ref(false)
const challengeVisible = ref(false)
const verifying = ref(false)
const feedback = ref('')
const challengeVersion = ref(0)
const gridTransitionKey = ref(0)
const tileDisplayOrder = ref<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9])

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
    top: `-${(sourceRow - 1) * 100}%`,
    left: `-${(sourceColumn - 1) * 100}%`,
  }
}

function tileAnimationStyle(row: number, column: number) {
  const delay = (tileAt(row, column).displayPosition - 1) * 55
  return {
    animationDelay: `${delay}ms`,
  }
}

function resetPanel() {
  selectedTileIds.value = []
  checkboxLoading.value = false
  challengeVisible.value = false
  verifying.value = false
  feedback.value = ''
  tileDisplayOrder.value = [1, 2, 3, 4, 5, 6, 7, 8, 9]
}

function chooseNextChallenge() {
  if (props.challenges.length <= 1) {
    currentIndex.value = 0
    return
  }

  let nextIndex = currentIndex.value
  while (nextIndex === currentIndex.value) {
    nextIndex = Math.floor(Math.random() * props.challenges.length)
  }
  currentIndex.value = nextIndex
}

async function openChallenge() {
  checkboxLoading.value = true
  feedback.value = ''
  await new Promise((resolve) => window.setTimeout(resolve, 280))
  shuffleTileDisplayOrder()
  challengeVersion.value += 1
  gridTransitionKey.value += 1
  challengeVisible.value = true
  checkboxLoading.value = false
}

function toggleTile(tileId: string) {
  if (verifying.value) {
    return
  }

  if (selectedTileIds.value.includes(tileId)) {
    selectedTileIds.value = selectedTileIds.value.filter((id) => id !== tileId)
    return
  }

  selectedTileIds.value = [...selectedTileIds.value, tileId]
}

async function reloadChallenge() {
  selectedTileIds.value = []
  feedback.value = ''
  verifying.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 220))
  chooseNextChallenge()
  shuffleTileDisplayOrder()
  challengeVersion.value += 1
  gridTransitionKey.value += 1
  verifying.value = false
}

async function verifySelection() {
  if (!currentChallenge.value || verifying.value) {
    return
  }

  if (selectedTileIds.value.length === 0) {
    feedback.value = '先点几张图，不然这关过得太敷衍。'
    return
  }

  verifying.value = true
  feedback.value = ''
  await new Promise((resolve) => window.setTimeout(resolve, 360))

  if (isSelectionCorrect.value) {
    emit('verified', currentChallenge.value.id)
    resetPanel()
    return
  }

  feedback.value = '答案不太对，再整一题。'
  chooseNextChallenge()
  shuffleTileDisplayOrder()
  challengeVersion.value += 1
  gridTransitionKey.value += 1
  selectedTileIds.value = []
  verifying.value = false
}

watch(
  () => props.open,
  (value) => {
    if (!value) {
      resetPanel()
      return
    }

    chooseNextChallenge()
    shuffleTileDisplayOrder()
    selectedTileIds.value = []
    feedback.value = ''
  },
  { immediate: true },
)
</script>

<template>
  <Transition name="modal-float" appear>
    <div v-if="open" class="modal-backdrop about-captcha-backdrop" @click.self="emit('close')">
      <div class="about-captcha-shell">
        <div class="captcha-container about-captcha-widget">
          <div class="captcha-box" @click="openChallenge">
            <div id="rc-anchor-container" class="rc-anchor rc-anchor-normal rc-anchor-light">
              <div id="recaptcha-accessible-status" class="rc-anchor-aria-status" aria-hidden="true">需要验证。</div>
              <div class="rc-anchor-error-msg-container">
                <span class="rc-anchor-error-msg" aria-hidden="true" />
              </div>
              <div class="rc-anchor-content">
                <div class="rc-inline-block">
                  <div class="rc-anchor-center-container">
                    <div class="rc-anchor-center-item rc-anchor-checkbox-holder">
                      <span
                        id="recaptcha-anchor"
                        class="recaptcha-checkbox goog-inline-block rc-anchor-checkbox"
                        :class="{ 'recaptcha-checkbox-unchecked': !challengeVisible, 'rc-anchor-checkbox': true }"
                        role="checkbox"
                        aria-checked="false"
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
                <div class="rc-inline-block">
                  <div class="rc-anchor-center-container">
                    <label id="recaptcha-anchor-label" class="rc-anchor-center-item rc-anchor-checkbox-label" aria-hidden="true">
                      是人吗你？
                    </label>
                  </div>
                </div>
              </div>
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

      <Transition name="modal-float" appear>
        <div v-if="challengeVisible && currentChallenge" class="about-captcha-challenge-layer" @click.self="emit('close')">
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
                    <div :key="gridTransitionKey" id="rc-imageselect-target" class="rc-imageselect-target" dir="ltr" role="presentation" aria-hidden="true">
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
                                  <img
                                    class="rc-image-tile-33 about-captcha-tile-composite"
                                    :src="currentChallenge.imageUrl"
                                    :alt="tileAt(row, column).alt"
                                    :style="compositeTileStyle(row, column)"
                                  />
                                  <div class="rc-image-tile-overlay" />
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
                          :disabled="verifying"
                          @click="reloadChallenge"
                        />
                      </div>
                    </div>
                    <div class="verify-button-holder">
                      <button
                        id="recaptcha-verify-button"
                        type="button"
                        class="rc-button-default goog-inline-block"
                        :class="{ 'rc-button-default-disabled': verifying }"
                        :disabled="verifying"
                        @click="verifySelection"
                      >
                        验证
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
}

.about-captcha-shell {
  width: 100%;
  min-height: min(520px, calc(100vh - 48px));
  display: flex;
  align-items: center;
  justify-content: center;
}

.about-captcha-widget {
  position: relative;
  z-index: 1;
  border-radius: 6px;
  overflow: hidden;
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
}

.about-captcha-selector .object-name {
  display: block;
  font-size: 36px;
  line-height: 1.15;
  font-weight: 700;
  margin: 6px 0 4px;
}

.about-captcha-selector .rc-imageselect-instructions {
  height: 114px;
  margin-bottom: 8px;
}

.about-captcha-selector .rc-imageselect-desc-wrapper {
  height: 114px;
  box-sizing: border-box;
  padding: 18px 24px 16px;
  display: flex;
  align-items: flex-start;
  border-radius: 8px 8px 0 0;
}

.about-captcha-selector .rc-imageselect-desc-no-canonical {
  width: 100%;
}

.about-captcha-tile-wrapper {
  width: 126px;
  height: 126px;
  border-radius: 2px;
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
  margin: 0 7px 7px;
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
  transition: opacity 320ms ease, transform 320ms ease;
}

.captcha-subject-fade-enter-from,
.captcha-subject-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
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
  .about-captcha-shell {
    min-height: min(520px, calc(100vh - 48px));
  }

  .about-captcha-selector {
    width: min(408px, calc(100vw - 48px));
  }

  .about-captcha-tile-wrapper {
    width: auto;
    height: auto;
    aspect-ratio: 1;
  }
}
</style>
