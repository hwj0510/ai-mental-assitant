<template>
    <el-dialog
        :title="isEdit ? '编辑文章' : '新增文章'"
        v-model="dialogVisible"
        width="50%"
        @close="handleClose"
    >
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
            <el-form-item label="文章标题" prop="title">
                <el-input v-model="formData.title" placeholder="请输入文章标题" maxlength="200" show-word-limit  clearable />
            </el-form-item>
            <el-form-item label="所属分类" prop="categoryId">
                <el-select v-model="formData.categoryId" placeholder="请选择所属分类" clearable>
                    <el-option v-for="item in props.categories" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="文章摘要" prop="summary">
                <el-input type="textarea" v-model="formData.summary" placeholder="请输入文章摘要（可选）" maxlength="1000" show-word-limit  :rows="4" />
            </el-form-item>
            <el-form-item label="标签" prop="tags">
                <el-select v-model="formData.tagArray" placeholder="请选择文章标签" multiple filterable allow-create style="width: 100%">
                    <el-option v-for="item in commonTags" :key="item" :label="item" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item label="封面图片">
                <div class="cover-upload">
                    <el-upload
                        class="avatar-uploader"
                        action="#"
                        :before-upload="beforeUpload"
                        :http-request="handleUploadRequest"
                        :show-file-list="false"
                        accept="image/*"
                        >
                        <div v-if="!imgUrl" class="cover-placeholder">
                            <p>点击上传封面</p>
                        </div>
                        <img v-else :src="imgUrl" class="cover-image" alt="封面图片">
                    </el-upload>
                    <div v-if="imgUrl" class="cover-remove">
                        <el-button type="danger" size="small" @click="handleRemove">移除封面</el-button>
                    </div>
                </div>
            </el-form-item>
            <el-form-item label="文章内容" prop="content">
                <RichEditor 
                    v-model="formData.content" 
                    placeholder="请输入文章内容，支持富文本格式\n\n可以使用加粗、斜体、列表、标题等格式来丰富文章内容。"
                    :maxCharCount="5000"
                    @change="handleContentChange"
                    @created="handleEditorCreate"
                    min-height="400px"
                    />
                </el-form-item>
        </el-form>
        <div v-if="btnPreview">
            <h3>内容预览</h3>
            <div v-html="formData.content"></div>
        </div>
        <template #footer>
            <el-button @click="btnPreview = !btnPreview">{{btnPreview ? '隐藏预览' : '预览效果'}}</el-button>
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="loading">{{isEdit ? '更新文章' : '创建文章'}}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { reactive, ref, computed, nextTick,watch } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadFile, createArticle, updateArticle } from '@/api/admin'
import { fileBaseUrl } from '@/config/index'
import RichEditor from '@/components/RichTextEditor.vue'

const btnPreview = ref(false)

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    categories: {
        type: Array,
        default: () => []
    },
    article: {
        type: Object,
        default: null
    }
})

const isEdit = computed(() => !!props.article?.id)

watch(() => props.article, (newVal) => {
    if(newVal){
        nextTick(()=>{
            Object.assign(formData, newVal)
            formData.tagArray = newVal.tags ? newVal.tags.split(',') : []
            //使用现有id
            businessId.value = newVal.id
            //封面Url
            imgUrl.value = fileBaseUrl + newVal.coverImage
            if(editorInstance.value){
                editorInstance.value.setHtml(newVal.content || '')
            }
        })
    }
})

const formData = reactive({
    "title": "",
    "content": "",
    "coverImage": "",
    "categoryId": "",
    "summary": "",
    "tags": "",
    "tagArray": [],
    "id":""
})
const rules = reactive({
    title: [
        { required: true, message: '请输入文章标题', trigger: 'blur' },
        { max: 50, message: '文章标题最多50个字符', trigger: 'blur' }
    ],
    categoryId: [
        { required: true, message: '请选择所属分类', trigger: 'change' }
    ],
    content: [
        { required: true, message: '请输入文章内容', trigger: 'blur' },
        { max: 5000, message: '文章内容最多5000个字符', trigger: 'blur' }
    ],
})

const emit = defineEmits(['update:modelValue','success'])

const dialogVisible = computed({
    get(){
        return props.modelValue
    },
    set(val){
        emit('update:modelValue',val)
    }
})
const beforeUpload = (file) => {
    //针对上传的文件进行校验
    const isImage = file.type.startsWith('image/')
    const isLt5M = file.size / 1024 / 1024 < 5
    if(!isImage){
        ElMessage.error('请上传图片文件')
        return false
    }
    if(!isLt5M){
        ElMessage.error('图片大小不能超过5MB')
        return false
    }
    return true
}
const businessId = ref(null)
watch(() => props.modelValue, (val) => {
    if (val && !isEdit.value) {
        businessId.value = crypto.randomUUID()
    }
})
const handleUploadRequest = async ({file}) => {
    //上传文件
    const fileRes = await uploadFile(file, {
        businessId: businessId.value
    })
    console.log(fileRes)

    //拼接完整的图片地址
    imgUrl.value = fileBaseUrl + fileRes.filePath
    formData.coverImage = fileRes.filePath
}
const handleRemove = () => {
    //移除封面图片
    imgUrl.value = ''
    formData.coverImage = ''
}

const imgUrl = ref('')
const handleClose = () => {
    //重置表单
    formRef.value.resetFields()
    //重置ID
    businessId.value = null
    //重置标签
    formData.tagArray = []
    //重置封面图片和数组
    handleRemove()
    emit('update:modelValue',false)
}

const commonTags = [
     '情绪管理', '焦虑', '抑郁', '压力', 
     '睡眠', '冥想', '正念', '放松', 
     '心理健康', '自我成长', '人际关系', 
     '工作压力', '学习方法', '生活技巧' 
     ]

//富文本
const handleContentChange = (data) => {
    formData.content = data.html
}

const editorInstance = ref(null)
const handleEditorCreate = (editor) => {
    editorInstance.value = editor
    //编辑
    if(formData.content && editor){
        nextTick(() => {
            editor.setHtml(formData.content)
        })
    }
}

//提交
const formRef = ref(null)
const loading = ref(false)
const handleSubmit = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return
        loading.value = true
        const submitData = {
            id: isEdit.value ? props.article.id : businessId.value,
            title: formData.title,
            content: formData.content,
            coverImage: formData.coverImage,
            categoryId: formData.categoryId,
            summary: formData.summary,
            tags: formData.tagArray.join(',')
        }
        try {
            if (isEdit.value) {
                //编辑
                await updateArticle(props.article.id, submitData)
            } else {
                //新增
                await createArticle(submitData)
            }
            emit('success')
        } finally {
            loading.value = false
        }
    })
}

</script>

<style lang="scss" scoped>
.cover-placeholder{
    width: 200px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: #8b949e;
    background: #f6f8fa;
}
.cover-image{
    width: 200px;
    height: 120px;
    display: block;
}
</style>