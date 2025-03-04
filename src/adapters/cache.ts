import localforage from 'localforage'

export type modelType = 'inpaint' | 'superResolution'

localforage.config({
  name: 'modelCache',
})

export async function saveModel(modelType: modelType, modelBlob: ArrayBuffer) {
  await localforage.setItem(getModel(modelType).name, modelBlob)
}

function getModel(modelType: modelType) {
  console.info(`import.meta.env.BASE_URL: ${import.meta.env.BASE_URL}`)
  if (modelType === 'inpaint') {
    const modelList = [
      {
        name: 'model',
        backupUrl: `https://${
          import.meta.env.VITE_HUGGINGFACE_MIRROR
            ? import.meta.env.VITE_HUGGINGFACE_MIRROR
            : 'huggingface.co'
        }/lxfater/inpaint-web/resolve/main/migan.onnx`,
        url: `${import.meta.env.BASE_URL}models/lxfater/inpaint-web/migan.onnx`,
      },
      {
        name: 'model-perf',
        backupUrl: `https://${
          import.meta.env.VITE_HUGGINGFACE_MIRROR
            ? import.meta.env.VITE_HUGGINGFACE_MIRROR
            : 'huggingface.co'
        }/andraniksargsyan/migan/resolve/main/migan.onnx`,
        url: `${
          import.meta.env.BASE_URL
        }models/andraniksargsyan/migan/migan.onnx`,
      },
      {
        name: 'migan-pipeline-v2',
        backupUrl: `https://${
          import.meta.env.VITE_HUGGINGFACE_MIRROR
            ? import.meta.env.VITE_HUGGINGFACE_MIRROR
            : 'huggingface.co'
        }/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx`,
        url: `${
          import.meta.env.BASE_URL
        }models/andraniksargsyan/migan/migan_pipeline_v2.onnx`,
      },
    ]
    const currentModel = modelList[2]
    return currentModel
  }
  if (modelType === 'superResolution') {
    const modelList = [
      {
        name: 'realesrgan-x4',
        backupUrl: `https://${
          import.meta.env.VITE_HUGGINGFACE_MIRROR
            ? import.meta.env.VITE_HUGGINGFACE_MIRROR
            : 'huggingface.co'
        }/lxfater/inpaint-web/resolve/main/realesrgan-x4.onnx`,
        url: `${
          import.meta.env.BASE_URL
        }models/lxfater/inpaint-web/realesrgan-x4.onnx`,
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  throw new Error('wrong modelType')
}

export async function loadModel(modelType: modelType): Promise<ArrayBuffer> {
  const model = (await localforage.getItem(
    getModel(modelType).name
  )) as ArrayBuffer
  return model
}

export async function modelExists(modelType: modelType) {
  const model = await loadModel(modelType)
  return model !== null && model !== undefined
}

export async function ensureModel(modelType: modelType) {
  if (await modelExists(modelType)) {
    return loadModel(modelType)
  }
  const model = getModel(modelType)
  const response = await fetch(model.url)
  const buffer = await response.arrayBuffer()
  await saveModel(modelType, buffer)
  return buffer
}

export async function downloadModel(
  modelType: modelType,
  setDownloadProgress: (arg0: number) => void
) {
  if (await modelExists(modelType)) {
    return
  }

  async function downloadFromUrl(url: string) {
    console.log('start download from', url)
    setDownloadProgress(0)
    const response = await fetch(url)
    const fullSize = response.headers.get('content-length')
    const reader = response.body!.getReader()
    const total: Uint8Array[] = []
    let downloaded = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      downloaded += value?.length || 0

      if (value) {
        total.push(value)
      }

      setDownloadProgress((downloaded / Number(fullSize)) * 100)
    }

    const buffer = new Uint8Array(downloaded)
    let offset = 0
    for (const chunk of total) {
      buffer.set(chunk, offset)
      offset += chunk.length
    }

    await saveModel(modelType, buffer)
    setDownloadProgress(100)
  }

  const model = getModel(modelType)
  try {
    await downloadFromUrl(model.url)
  } catch (e) {
    if (model.backupUrl) {
      try {
        await downloadFromUrl(model.backupUrl)
      } catch (r) {
        alert(`Failed to download the backup model: ${r}`)
      }
    }
    alert(`Failed to download the model, network problem: ${e}`)
  }
}
