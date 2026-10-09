import axios from 'axios'
import { ElMessage } from 'element-plus'

//创建axios实例
const service = axios.create({
    baseURL: '/api',//请求的前缀
    timeout: 5000//请求的超时时间
})

//请求拦截器
service.interceptors.request.use(
    (config) => {
        //在发送请求之前做些什么
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['token'] = token
        }
        return config
    },
    (error) => {
        //对请求错误做些什么
        return Promise.reject(error)
    }
)

//响应拦截器
service.interceptors.response.use(
    (response) => {
        //对响应数据做点什么
        const { data, config } = response
        // 用 String() 兼容后端返回数字或字符串状态码
        const code = String(data?.code ?? '')
        // 兼容后端 msg / message 两种字段命名
        const message = data?.msg || data?.message

        //处理业务状态码
        if (code === '200') {
            return data.data
        }

        if (code === '-1') {
            const isAuthApi = config.url?.includes('/login') || config.url?.includes('/user/add')
            if (!isAuthApi) {
                ElMessage.error(message || '登录过期，请重新登录')
                // 清除登录信息
                localStorage.removeItem('token')
                localStorage.removeItem('userInfo')
                window.location.href = '/auth/login'
            } else {
                // 登录/注册接口的业务失败（如密码错误）也要给出提示
                ElMessage.error(message || '请求失败')
            }
            // 统一 reject，避免调用方拿到未解包的 response
            return Promise.reject(new Error(message || '请求失败'))
        }

        // 其他业务错误码
        ElMessage.error(message || '请求失败')
        return Promise.reject(new Error(message || '请求失败'))
    },
    (error) => {
        //对响应错误做点什么
        return Promise.reject(error)
    }
)

export default service