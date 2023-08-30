<template>
  <div class="container row full-height">
    <ModelList />
    <div class="container col-10 column items-center  full-height bg-grey-4">
      <q-scroll-area
        ref="scrollRef"
        class="scroll-area q-px-md col-grow row-grow"
      >
        <q-list
          padding
        >
          <q-item-label header>
            CRISPE Prompt 框架
          </q-item-label>
          <q-item>
            <q-item-section>
              <q-item-label overline>
                Capacity and Role
              </q-item-label>
              <q-item-label caption>
                What role (or roles) should ChatGPT act as?
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>
                Insight
              </q-item-label>
              <q-item-label caption>
                Provides the behind the scenes insight, background, and context to your request.
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>
                Statement
              </q-item-label>
              <q-item-label caption>
                What you are asking ChatGPT to do.
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>
                Personality
              </q-item-label>
              <q-item-label caption>
                The style, personality, or manner you want ChatGPT to respond in.
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>
                Experiment
              </q-item-label>
              <q-item-label caption>
                Asking ChatGPT to provide multiple examples to you.
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div class="row q-gutter-md q-px-md">
          <q-btn
            v-for="item in promptTips"
            :key="item.label"
            rounded
            @click="promptTip(item)"
          >
            {{ item.label }}
          </q-btn>
        </div>
        <q-chat-message
          v-for="(message, idx) in messageArr"
          :key="idx"
          :avatar="message.sender === 'you' ? meUrl:chatUrl"
          :text="message.sender === 'you'? [message.message]: [markedMessage(message.message)]"
          :name="message.sender === 'you'?'me':'CodeGPT'"
          :sent="message.sender === 'you'"
          :text-html="message.sender === 'bot'"
          class="text-body1"
          :bg-color="message.sender === 'bot' ? 'grey-2' : 'green-5'"
        />
        <div
          v-show="messageArr.length > 0 && !sendDisabled"
          class="row q-pl-xl q-pb-md"
        >
          <q-btn
            color="teal"
            rounded
            @click="retry"
          >
            重新回答
          </q-btn>
        </div>
      </q-scroll-area>
      <q-separator class="full-width" />
      <div
        ref="inputRef"
        class="footer full-width q-pt-md q-pb-none bg-grey-1 q-px-sm"
        style="position: relative;"
      >
        <q-list
          v-show="computedPromptArr.length > 0"
          bordered
          separator
          class="rounded-borders"
          style="position: absolute;left: 0;top: 0;transform: translate(60px, calc(-100% + 14px));background-color: white; z-index: 1;"
        >
          <q-item
            v-for="(item, index) in computedPromptArr"
            :key="item"
            clickable
            dense
            :active="promptActive === index"
          >
            <q-item-section>{{ item }}</q-item-section>
          </q-item>
        </q-list>
        <q-input
          v-model="newMessage"
          bottom-slots
          rounded
          outlined
          placeholder="请在此输入您的问题"
          class="full-width"
          @keyup.enter="add"
          @keydown.up.prevent="keyUp"
          @keydown.down.prevent="keyDown"
        >
          <template #before>
            <q-avatar>
              <img src="../assets/chatgirl.png">
            </q-avatar>
          </template>

          <template #append>
            <q-icon
              v-if="newMessage !== ''"
              name="close"
              class="cursor-pointer"
              @click="newMessage = ''"
            />
          </template>


          <template #after>
            <q-btn
              round
              dense
              flat
              icon="send"
              :disable="sendDisabled"
              @click="add"
            />
            <q-btn
              round
              dense
              flat
              icon="replay"
              @click="clear"
            />
          </template>
        </q-input>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from '@vue/reactivity'
import { QScrollArea, useQuasar } from 'quasar'
import { onMounted, onUnmounted, onUpdated, reactive, ref, watch } from 'vue'
import {marked} from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import meUrl from '../assets/chatgirl.png'
import chatUrl from '../assets/chatbot.png'
import ModelList from './ModelList.vue'
interface WSMessage {
  sender: string
  type: string
  message: string
}
interface PromptTip {
  label: string
  command: string
}

const scrollRef = ref< QScrollArea | null>(null)
const inputRef = ref< HTMLDivElement | null>(null)
const newMessage = ref('')
const messageArr = ref <Array<WSMessage>>([])
const sendDisabled = ref(false)
const $q = useQuasar()
const promptArr = ['chatgpt', 'codeflow', 'pipeline']
const promptActive = ref(0)
let commandTag = ''
const promptTips: PromptTip[] = [{label: 'codeflow 登录鉴权 FAQ', command: 'codeflow'}, {label: 'codeflow 工作空间 FAQ', command: 'codeflow'}, {label: 'codeflow 终端连接 FAQ', command: 'codeflow'}]
const computedPromptArr = computed(() => {
  if (newMessage.value.startsWith('/')) {
    const len = newMessage.value.length
    const str = newMessage.value.slice(1, len)
    return promptArr.filter((item) => item.includes(str))
  }
  return []
})

watch(computedPromptArr, () => {
  promptActive.value = 0
})


marked.setOptions({
  highlight: function (code: string) {
    return hljs.highlightAuto(code).value
  }
})
const websocketRef = reactive<{
  socket: WebSocket | null
}>({
  socket: null
})

const markedMessage = (msg: string) => {
  if (msg === '') {
    return '思考中 ...'
  }
  return marked.parse(msg)
}

let lastSendData = {
  command: '',
  prompt: ''
}

const add = async() => {
  if (computedPromptArr.value.length > 0) {
    commandTag = computedPromptArr.value[promptActive.value]
    newMessage.value = '/' + computedPromptArr.value[promptActive.value] + '  '
  } else if (newMessage.value !== '' && sendDisabled.value === false) {
    if (websocketRef.socket?.readyState === WebSocket.CLOSED) {
      await createSocket()
    }
    const sendData = {
      command: promptArr[0],
      prompt: newMessage.value
    }
    if (commandTag.length > 0) {
      const len = 1 + commandTag.length + 2
      sendData.prompt = newMessage.value.slice(len, newMessage.value.length)
      sendData.command = commandTag
    }
    lastSendData = sendData

    websocketRef.socket?.send(JSON.stringify(sendData))
    messageArr.value.push({
      sender: 'you',
      message: newMessage.value,
      type: 'end'
    })
    newMessage.value = ''
    sendDisabled.value = true
    commandTag = ''
    setTimeout(() => {
      scrollRef.value?.setScrollPercentage('vertical', 1)
    }, 300)
  }
}
const clear = () => {
  messageArr.value = []
}
const keyUp = async() => {
  const len = computedPromptArr.value.length
  if (len > 0) {
    if (promptActive.value > 0) {
      promptActive.value = promptActive.value - 1
    } else {
      promptActive.value = len - 1
    }
  }
}
const keyDown = async() => {
  const len = computedPromptArr.value.length
  if (promptActive.value < len - 1) {
    promptActive.value = promptActive.value + 1
  } else {
    promptActive.value = 0
  }
}

const createSocket = async () => {
  websocketRef.socket = await new WebSocket(import.meta.env.VITE_CHAT_URL)
  websocketRef.socket.onopen = () => {
    console.log('websocket open')
  }
  websocketRef.socket.onmessage = (ev: MessageEvent) => {
    const data = JSON.parse(ev.data) as WSMessage
    if (data.type === 'start' && data.sender === 'bot') {
      messageArr.value.push(data)
      setTimeout(() => {
        scrollRef.value?.setScrollPercentage('vertical', 1)
      }, 300)
    } else if (data.type === 'stream') {
      if (data.sender === 'bot') {
        const len = messageArr.value.length
        if (len > 0) {
          messageArr.value[len - 1].message += data.message
        }
      }
      setTimeout(() => {
        scrollRef.value?.setScrollPercentage('vertical', 1)
      }, 300)
    } else if (data.type === 'end') {
      sendDisabled.value = false
      setTimeout(() => {
        scrollRef.value?.setScrollPercentage('vertical', 1)
      }, 300)
    } else if (data.type === 'error') {
      sendDisabled.value = false
      $q.notify({
        message: 'CodeGPT运行出错:' + data.message,
        type: 'negative',
        timeout: 5000
      })
      const len = messageArr.value.length
      if (len > 0) {
        messageArr.value[len - 1].message += `[CodeGPT运行出错: ${data.message}]`
      }
    }
  }
  websocketRef.socket.onclose = () => {
    sendDisabled.value = false
    console.log('websocket close')
  }
  websocketRef.socket.onerror = (ev: Event) => {
    sendDisabled.value = false
    console.log('websocket error', ev)
    $q.notify({
      message: 'CodeGPT运行出错:' + ev,
      type: 'negative',
      timeout: 5000
    })
    const len = messageArr.value.length
    if (len > 0) {
      messageArr.value[len - 1].message += '[ERROR]'
    }

  }

}

const promptTip = (tip: PromptTip) => {
  commandTag = tip.command
  newMessage.value = '/' + tip.command + '  ' + tip.label
  add()
}

const retry = () => {
  commandTag = lastSendData.command
  newMessage.value = '/' + lastSendData.command + '  ' + lastSendData.prompt
  add()

}


onMounted(() => {
  scrollRef.value?.setScrollPercentage('vertical', 1)
  createSocket()
})

onUnmounted(() => {
  websocketRef.socket?.close()
})


</script>

<style scoped lang="scss">
.container {
  min-width: 500px;
  .scroll-area{
    width: 100%;
  }
}

</style>
