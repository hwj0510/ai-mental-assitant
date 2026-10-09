<template>
    <div class="navbar">
        <div class="flex-box">
            <el-button @click="handleCollapse">
                <el-icon><Expand /></el-icon>
            </el-button>
            <p class="page-title">{{route.meta.title}}</p>
        </div>
        <div class="flex-box">
            <el-dropdown @command="handleCommand">
                <div class="flex-box">
                    <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                    <p class="user-name">admin</p>
                    <el-icon><ArrowDown /></el-icon>
                </div>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </div>
</template>

<script setup>
import { useAdminStore } from '@/stores/admin.js'
import { useRouter,useRoute } from 'vue-router'
import { logout } from '@/api/admin.js'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()

const handleCommand = (command) => {
    if (command === 'logout') {
        // 退出登录逻辑
        ElMessageBox.confirm('确定退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            // 确认退出登录
            logout().catch(()=>{}).finally(() => {
                // 无论后端退出是否成功，前端都清除缓存并跳转
                localStorage.removeItem('token')
                localStorage.removeItem('userInfo')
                router.push('/auth/login')
            })
        })
    }
}

const handleCollapse = () => {
    useAdminStore().toggleCollapse()
}

</script>

<style lang="scss" scoped>
.navbar {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    border-bottom: 1px solid #e4e7ed;
    .flex-box {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .page-title {
        font-size: 26px;
        margin-left: 20px;
        font-weight: bold;
        color: #1f2937;
    }
}
</style>