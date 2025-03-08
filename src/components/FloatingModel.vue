<template>
  <div ref="container" class="floating-model" :style="style">
    <!-- Three.js 画布容器 -->
    <canvas ref="canvas" class="webgl-canvas"></canvas>

    <!-- 悬浮对话框 -->
    <transition name="fade">
      <div v-if="showDialog" class="dialog">
        {{ dialogContent }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useDraggable, useElementHover } from '@vueuse/core'

// Props定义
const props = defineProps({
  modelUrl: {
    type: String,
    required: true
  },
  scale: {
    type: Number,
    default: 1
  },
  autoRotate: {
    type: Boolean,
    default: true
  },
  dialogContent: {
    type: String,
    default: 'Interactive 3D Model'
  }
})

// Three.js核心对象
const canvas = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let model: THREE.Group | null = null
const scene = new THREE.Scene()

// 交互状态
const container = ref<HTMLElement | null>(null)
const { isDragging, style } = useDraggable(container)
const showDialog = useElementHover(container)

// 初始化场景
const initScene = () => {
  if (!canvas.value) return

  // 初始化渲染器（直接赋值）
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // 初始化相机（直接赋值）
  camera = new THREE.PerspectiveCamera(90, 0.33, 0.1, 1000)
  camera.position.set(0, 0, 8)


  // 初始化控制器（直接赋值）
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)
}

// 加载3D模型
const loadModel = async () => {
  if (!props.modelUrl) return;
  console.log(THREE.REVISION);
  const loader = new GLTFLoader();
  // 设置纹理路径解析规则
  loader.setResourcePath('/model/cat_girl/') // 关键配置
  loader.load(
    '/model/cat_girl/scene.gltf',
    (gltf) => {
      model = gltf.scene
      // 遍历模型材质调整设置
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material]

          materials.forEach(material => {
            //处理基础颜色贴图
            if (material.map) {
              material.map.colorSpace = THREE.SRGBColorSpace
            }
            // 处理自发光材质
            if (material.emissiveMap) {
              material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
              material.emissive.set(0xffffff);
              material.emissiveIntensity = 0.5;
            }
            // 启用雾效等环境效果
            material.fog = true;
            material.needsUpdate = true;
          })
        }
      });
      scene.add(model)
      // 调整相机初始位置
      const bbox = new THREE.Box3().setFromObject(model)
      const center = bbox.getCenter(new THREE.Vector3())
      const size = bbox.getSize(new THREE.Vector3())
      const head = new THREE.Vector3(center.x,center.y+0.4*size.y,center.z);
      // 计算最佳观察距离（基于模型大小）
      const maxDim = Math.max(size.x, size.y, size.z)
      const cameraDistance = maxDim * 1.2
      // 设置相机位置
      camera?.position.copy(head)
      camera?.position.add({x:0,y:0,z:cameraDistance});
      camera?.lookAt(head);               // 确保相机对准模型中心
      console.log(
        "center:"+center.x+' '+center.y+' '+center.z
        +" CameraDistance:"+cameraDistance
        +' size:'+size.x+' '+size.y+' '+size.z
      );

      // 添加环境光照提升材质表现
      const envLight = new THREE.AmbientLight(0xffffff, 0.8)
      scene.add(envLight)
    },
    (xhr) => {
      console.log(`模型加载进度: ${(xhr.loaded / xhr.total * 100)}%`)
    },
    (error) => {
      console.error('模型加载失败:', error)
    }
  )
}

// 响应式更新
watch(isDragging, (dragging) => {
  if (controls) {
    controls.enabled = !dragging
  }
})

// 处理窗口大小变化
const handleResize = () => {
  if (!camera || !renderer || !container.value) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 渲染循环
const animate = () => {
  requestAnimationFrame(animate)

  if (controls) {
    controls.update()
  }

  if (model && props.autoRotate && !isDragging.value) {
    model.rotation.y += 0.005
  }

  if (renderer && camera) {
    renderer.render(scene, camera)
  }
}

// 生命周期
onMounted(async () => {
  initScene()
  await loadModel()
  animate()
  window.addEventListener('resize', handleResize)
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (model) {
    scene.remove(model)
    model.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  }
})
</script>

<style scoped>
.floating-model {
  position: fixed;
  width: 300px;
  height: 300px;
  cursor: grab;
  z-index: 1000;
}

.webgl-canvas {
  width: 100%;
  height: 100%;
}

.dialog {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
