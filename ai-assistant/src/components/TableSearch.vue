<template>
    <el-form ref="ruleFormRef" :model="formData">
        <el-row :gutter="24">
            <template v-for="item in formItemAttr" :key="item.prop">
                <el-col v-bind="item.col">
                    <el-form-item :label="item.label" :prop="item.prop">
                        <component v-model="formData[item.prop]" :is="isComp(item.comp)" :placeholder="item.placeholder">
                            <template v-if="item.comp === 'select'">
                                <el-option label="全部" value="" />
                                <el-option 
                                    v-for="opt in item.options"
                                    :key="opt.value"
                                    :label="opt.label"
                                    :value="opt.value"/>
                            </template>
                        </component>
                    </el-form-item>
                </el-col>
            </template>
        </el-row>
        <el-row>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset(ruleFormRef)">重置</el-button>
        </el-row>
    </el-form>
</template>
<script setup>
import { ref,reactive,computed } from 'vue';

const props = defineProps({
    formItem: {
        type: Array,
        default: () => []
    }
})
//声明当前组件可以向外触发一个叫 search 的事件，并且把触发事件的方法赋值给 emit 变量。
const emit = defineEmits(['search'])

const formItemAttr = computed(() => {
    const {formItem} = props
    formItem.forEach(item => {
        item.col = {xs: 24,sm: 12,md: 8,lg: 6,xl:6}
    })
    return formItem
})

//表单数据
const ruleFormRef = ref()
const formData = reactive({})
const isComp = (comp) =>{
    return{
        input: 'elInput',
        select: 'elSelect'
    }[comp]
}

const handleSearch = () =>{
    //console.log(formData)
    emit('search', formData)//子组件 → 向父组件发送消息，并携带数据
}

const handleReset = (formEl) =>{
    //先重置表单，后触发查询
    if(!formEl) return
    formEl.resetFields()
    emit('search', formData)
}

</script>