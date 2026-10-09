<template>
    <el-aside :width="isCollapse ? '64px' : '264px'"> 
        <el-menu
        :collapse="isCollapse"
        :collapse-transition="false"
        default-active="2"
        class="menu-style"
      >
        <div class="brand">
            <el-image style="width: 50px; height: 50px; margin-right: 10px;" :src="iconUrl" alt="logo" />
            <div v-if="!isCollapse" class="info-card">
                <h1 class="brand-title">心理健康AI助手</h1>
                <p class="brand-subtitle">管理后台</p>
            </div>
        </div>

        <el-menu-item @click="selectMenu" v-for="item in menuItems" :key="item.path" :index="item.path">
            <el-icon><component :is="item.meta.icon" /></el-icon>
            <span>{{ item.meta.title }}</span>
        </el-menu-item>
        
      </el-menu>
    </el-aside>
</template>

<script setup>
    import { useRouter } from 'vue-router'
    import { useAdminStore } from '@/stores/admin.js'
    import { computed } from 'vue'
    const router = useRouter()

    const iconUrl = new URL('/src/assets/images/机器人.png', import.meta.url).href

    // 按路径查找后台路由，避免依赖 routes 数组顺序
    const backendRoute = router.options.routes.find(r => r.path === '/back')
    const menuItems = backendRoute?.children ?? []

    const selectMenu = (key) => {
        // 基于实际路由的 path 拼接，路由结构调整时依然有效
        router.push(`${backendRoute.path}/${key.index}`)
    }

    const isCollapse = computed(() => useAdminStore().isCollapse)

</script>

<style lang="scss" scoped>
.menu-style {
    height: 100%;
    .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    background-color: #fff;
    border-bottom: 1px solid #e4e7ed;
    .info-card {
        .brand-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #1f2937;
        }
        .brand-subtitle {
            font-size: 14px;
            color: #6b7280;
        }
    }
}
}
</style>
