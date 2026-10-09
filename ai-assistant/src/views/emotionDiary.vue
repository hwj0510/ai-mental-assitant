<template>
    <div class="emotionDiary-container">
        <div class="header-section">
            <div class="header-content">
                <el-image :src="iconUrl" style="width: 60px; height: 60px;" />
                <h1>情绪日志</h1>
            </div>
            <div class="header-actions">
                <el-button type="primary" @click="showHistoryDialog = true">
                    <el-icon><Document /></el-icon>
                    <span>历史记录</span>
                </el-button>
            </div>
        </div>
        <div class="content">
            <!-- 情绪评分 -->
            <div class="diary-card">
                <div class="title">情绪评分</div>
                <div class="section">
                    <p>您今天的整体情绪状态如何?（1-10分）</p>
                    <div class="rate">
                        <el-rate 
                            v-model="diaryForm.moodScore"
                            :texts="emotionStatus"
                            show-text
                            :max="10"
                            size="large"
                        />
                    </div>
                </div>
            </div>
            <!-- 主要情绪 -->
            <div class="diary-card">
                <div class="title">主要情绪</div>
                <div class="emotion-grid">
                    <div v-for="emotion in emotionOptions" :key="emotion.name" class="emotion-card" :class="{'selected': emotion.name === diaryForm.dominantEmotion}" @click="selectEmotion(emotion.name)">
                        <el-image :src="emotion.url" style="width: 50px; height: 50px;" />
                        <div class="emotion-name">{{ emotion.name }}</div>
                    </div>
                </div>
            </div>
            <!-- 评测记录 -->
            <div class="diary-card">
                <div class="title">评测记录</div>
                <div class="detail-form">
                    <div class="form-group">
                        <div class="form-label">情绪触发因素</div>
                        <el-input v-model="diaryForm.emotionTriggers" placeholder="今天什么事情影响了您的情绪？" type="textarea" :rows="3" maxLength="1000" show-word-limit />
                    </div>
                    <div class="form-group">
                        <div class="form-label">今日感想</div>
                        <el-input v-model="diaryForm.diaryContent" placeholder="写下您今天的想法，感受或发生的有趣事情..." type="textarea" :rows="5" maxLength="1000" show-word-limit />
                    </div>
                    <!-- 生活指标 -->
                     <div class="life-indicators">
                        <div class="indicator-group">
                            <div class="form-label">睡眠质量</div>
                            <el-select v-model="diaryForm.sleepQuality" placeholder="请选择">
                                <el-option label="很差" value="1" />
                                <el-option label="较差" value="2" />
                                <el-option label="一般" value="3" />
                                <el-option label="良好" value="4" />
                                <el-option label="优秀" value="5" />
                            </el-select>
                        </div>
                        <div class="indicator-group">
                            <div class="form-label">压力水平</div>
                            <el-select v-model="diaryForm.stressLevel" placeholder="请选择">
                                <el-option label="很低" value="1" />
                                <el-option label="较低" value="2" />
                                <el-option label="中等" value="3" />
                                <el-option label="较高" value="4" />
                                <el-option label="很高" value="5" />
                            </el-select>
                        </div>
                     </div>
                     <div class="action-buttons">
                        <el-button @click="resetForm">重置</el-button>
                        <el-button type="primary" @click="submit">提交</el-button>
                     </div>
                </div>
            </div>
        </div>

        <!-- 历史记录弹窗 -->
        <el-dialog v-model="showHistoryDialog" title="历史记录" width="800px" :close-on-click-modal="false">
            <div class="history-container">
                <!-- 筛选条件 -->
                <div class="history-filter">
                    <el-date-picker
                        v-model="filterDateRange"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        value-format="YYYY-MM-DD"
                    />
                    <el-button type="primary" @click="loadHistoryList">查询</el-button>
                    <el-button @click="resetFilter">重置</el-button>
                </div>

                <!-- 历史列表 -->
                <div class="history-list" v-loading="historyLoading">
                    <div v-if="historyList.length === 0 && !historyLoading" class="empty-tip">暂无历史记录</div>
                    <div v-for="item in historyList" :key="item.id" class="history-item" @click="viewDetail(item)">
                        <div class="history-header">
                            <div class="history-date">{{ item.diaryDate }}</div>
                            <div class="history-score" :class="getScoreClass(item.moodScore)">
                                {{ item.moodScore }}分
                            </div>
                        </div>
                        <div class="history-body">
                            <div class="history-emotion">
                                <span class="label">主要情绪：</span>
                                <span class="value">{{ item.dominantEmotion || '-' }}</span>
                            </div>
                            <div class="history-content" v-if="item.diaryContent">
                                {{ item.diaryContent.length > 80 ? item.diaryContent.substring(0, 80) + '...' : item.diaryContent }}
                            </div>
                        </div>
                        <div class="history-footer">
                            <span class="indicator" v-if="item.sleepQuality">睡眠: {{ getSleepText(item.sleepQuality) }}</span>
                            <span class="indicator" v-if="item.stressLevel">压力: {{ getStressText(item.stressLevel) }}</span>
                            <el-button size="small" type="primary" link @click.stop="viewDetail(item)">查看详情</el-button>
                        </div>
                    </div>
                </div>

                <!-- 分页 -->
                <div class="history-pagination" v-if="historyTotal > 0">
                    <el-pagination
                        v-model:current-page="historyPage"
                        v-model:page-size="historyPageSize"
                        :total="historyTotal"
                        :page-sizes="[10, 20, 50]"
                        layout="total, sizes, prev, pager, next, jumper"
                        background
                        @size-change="handleSizeChange"
                        @current-change="loadHistoryList"
                    />
                </div>
            </div>
        </el-dialog>

        <!-- 详情弹窗 -->
        <el-dialog v-model="showDetailDialog" title="日志详情" width="600px">
            <div class="detail-container" v-if="currentDetail">
                <div class="detail-section">
                    <div class="detail-label">日期</div>
                    <div class="detail-value">{{ currentDetail.diaryDate }}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-label">情绪评分</div>
                    <div class="detail-value">
                        <el-rate v-model="currentDetail.moodScore" disabled :max="10" />
                        <span class="score-text">{{ getEmotionText(currentDetail.moodScore) }}</span>
                    </div>
                </div>
                <div class="detail-section">
                    <div class="detail-label">主要情绪</div>
                    <div class="detail-value">{{ currentDetail.dominantEmotion || '-' }}</div>
                </div>
                <div class="detail-section" v-if="currentDetail.emotionTriggers">
                    <div class="detail-label">情绪触发因素</div>
                    <div class="detail-value content-text">{{ currentDetail.emotionTriggers }}</div>
                </div>
                <div class="detail-section" v-if="currentDetail.diaryContent">
                    <div class="detail-label">今日感想</div>
                    <div class="detail-value content-text">{{ currentDetail.diaryContent }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-section half">
                        <div class="detail-label">睡眠质量</div>
                        <div class="detail-value">{{ getSleepText(currentDetail.sleepQuality) }}</div>
                    </div>
                    <div class="detail-section half">
                        <div class="detail-label">压力水平</div>
                        <div class="detail-value">{{ getStressText(currentDetail.stressLevel) }}</div>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
    import { dayjs, ElMessage } from 'element-plus'
    import { ref, reactive, watch } from 'vue'
    import { addEmotionDiary, getEmotionDiaryList } from '@/api/frontend'
    import { Document } from '@element-plus/icons-vue'

    //情绪评分
    const emotionStatus = ['绝望崩溃', '消沉抑郁', '焦虑烦躁', '低落不悦', '平静淡然', '轻松惬意', '愉悦舒心', '欢欣满足', '兴奋欣喜', '极致幸福']

    //情绪选项
    const emotionOptions =[
        { name: '开心' , url: new URL('@/assets/images/开心.png', import.meta.url).href},
        { name: '平静' , url: new URL('@/assets/images/平静.png', import.meta.url).href},
        { name: '焦虑' , url: new URL('@/assets/images/焦虑.png', import.meta.url).href},
        { name: '悲伤' , url: new URL('@/assets/images/悲伤.png', import.meta.url).href},
        { name: '兴奋' , url: new URL('@/assets/images/兴奋.png', import.meta.url).href},
        { name: '疲惫' , url: new URL('@/assets/images/疲惫.png', import.meta.url).href},
        { name: '惊讶' , url: new URL('@/assets/images/惊讶.png', import.meta.url).href},
        { name: '困惑' , url: new URL('@/assets/images/困惑.png', import.meta.url).href}
    ]

    //选择情绪
    const selectEmotion = (emotion) => {
        diaryForm.dominantEmotion = emotion
    }

    const diaryForm = reactive({
        diaryDate: dayjs().format('YYYY-MM-DD'),
        moodScore: null,
        dominantEmotion: '',
        emotionTriggers: '',
        diaryContent: '',
        sleepQuality: null,
        stressLevel: null
    })

    //重置表单
    const resetForm = () => {
        Object.assign(diaryForm, {
            diaryDate: dayjs().format('YYYY-MM-DD'),
            moodScore: null,
            dominantEmotion: '',
            emotionTriggers: '',
            diaryContent: '',
            sleepQuality: null,
            stressLevel: null
        })
    }
    
    //提交表单
    const submit = () => {
        if(!diaryForm.moodScore) {
            ElMessage.error('请选择情绪评分')
            return
        }
        addEmotionDiary(diaryForm).then(()=>{
            ElMessage.success('提交成功')
            resetForm()
        })
    }
    
    const iconUrl = new URL('@/assets/images/like.png', import.meta.url).href

    // ========== 历史记录相关 ==========

    // 弹窗控制
    const showHistoryDialog = ref(false)
    const showDetailDialog = ref(false)
    const currentDetail = ref(null)

    // 历史列表数据
    const historyList = ref([])
    const historyTotal = ref(0)
    const historyLoading = ref(false)
    const historyPage = ref(1)
    const historyPageSize = ref(10)

    // 筛选条件
    const filterDateRange = ref(null)

    // 加载历史列表（后端根据 token 识别当前用户，只返回该用户的记录）
    const loadHistoryList = async () => {
        historyLoading.value = true
        try {
            const params = {
                pageNum: historyPage.value,
                pageSize: historyPageSize.value
            }
            if (filterDateRange.value && filterDateRange.value.length === 2) {
                params.startDate = filterDateRange.value[0]
                params.endDate = filterDateRange.value[1]
            }
            const res = await getEmotionDiaryList(params)
            historyList.value = res.records || []
            historyTotal.value = res.total || 0
        } catch (error) {
            ElMessage.error('加载历史记录失败')
        } finally {
            historyLoading.value = false
        }
    }

    // 重置筛选
    const resetFilter = () => {
        filterDateRange.value = null
        historyPage.value = 1
        loadHistoryList()
    }

    // 每页条数变化时回到第一页
    const handleSizeChange = () => {
        historyPage.value = 1
        loadHistoryList()
    }

    // 查看详情
    const viewDetail = (item) => {
        currentDetail.value = { ...item }
        showDetailDialog.value = true
    }

    // 辅助函数
    const getScoreClass = (score) => {
        if (score >= 7) return 'high'
        if (score >= 4) return 'medium'
        return 'low'
    }

    const getEmotionText = (score) => {
        if (!score || score < 1) return ''
        return emotionStatus[score - 1] || ''
    }

    const getSleepText = (value) => {
        const map = { '1': '很差', '2': '较差', '3': '一般', '4': '良好', '5': '优秀' }
        return map[String(value)] || '-'
    }

    const getStressText = (value) => {
        const map = { '1': '很低', '2': '较低', '3': '中等', '4': '较高', '5': '很高' }
        return map[String(value)] || '-'
    }

    // 监听弹窗打开事件，自动加载历史数据
    watch(showHistoryDialog, (newVal) => {
        if (newVal) {
            loadHistoryList()
        }
    })
</script>

<style scoped lang="scss">
.emotionDiary-container {
    background: linear-gradient(135deg, #fafbfc 0%, #f7f9fc 50%, #f2f6fa 100%);
    min-height: 100vh;
    .header-section {
        background: linear-gradient(135deg, #7ED321 0%, #F5A623 100%);
        color: white;
        padding: 48px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .header-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .header-actions {
            :deep(.el-button) {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
                color: white;
                &:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                .el-icon {
                    margin-right: 4px;
                }
            }
        }
    }
    .content {
        margin: 0 auto;
        width: 980px;
        padding: 20px;
        .diary-card {
            margin-bottom: 20px;
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            .title {
                margin-bottom: 20px;
                font-size: 25px;
                font-weight: 600;
                color: #374151;
            }
            .section {
                margin-bottom: 20px;
                p {
                    font-size: 15px;
                    color: #6B7280;
                    margin-bottom: 15px;
                }
            }
            .emotion-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                .emotion-card {
                    padding: 15px;
                    border: 2px solid #E5E7EB;
                    border-radius: 15px;
                    text-align: center;
                    cursor: pointer;
                    background: #F9FAFB;
                    .emotion-name {
                        margin-top: 10px;
                        padding: 0 75px;
                        color: #374151;
                    }
                    &.selected {
                        border-color: #7ED321;
                        background: #F0FDF4;
                        transform: translateY(-3px);
                    }
                }
            }
            .detail-form {
                .form-label {
                    margin: 10px 0;
                    color: #374151;
                }
                .life-indicators {
                    display: flex;
                    gap: 20px;
                    .indicator-group {
                        flex: 1;
                    }
                }
                .action-buttons {
                    margin-top: 40px
                }
            }
        }
    }
}

// 历史记录弹窗样式
.history-container {
    .history-filter {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        padding: 15px;
        background: #f5f7fa;
        border-radius: 8px;
    }
    .history-list {
        max-height: 400px;
        overflow-y: auto;
        .empty-tip {
            text-align: center;
            padding: 40px;
            color: #999;
        }
    }
    .history-item {
        padding: 15px;
        margin-bottom: 10px;
        background: #f9fafb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
        &:hover {
            background: #f0f7ff;
            border-color: #4096ff;
        }
        .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            .history-date {
                font-weight: 600;
                color: #374151;
            }
            .history-score {
                padding: 4px 12px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 14px;
                &.high {
                    background: #f0fdf4;
                    color: #16a34a;
                }
                &.medium {
                    background: #fef9e7;
                    color: #ca8a04;
                }
                &.low {
                    background: #fef2f2;
                    color: #dc2626;
                }
            }
        }
        .history-body {
            margin-bottom: 10px;
            .history-emotion {
                color: #6b7280;
                margin-bottom: 5px;
                .label {
                    color: #9ca3af;
                }
                .value {
                    color: #374151;
                    font-weight: 500;
                }
            }
            .history-content {
                color: #6b7280;
                font-size: 14px;
                line-height: 1.5;
            }
        }
        .history-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .indicator {
                font-size: 12px;
                color: #9ca3af;
                margin-right: 15px;
            }
        }
    }
    .history-pagination {
        margin-top: 20px;
        display: flex;
        justify-content: center;
    }
}

// 详情弹窗样式
.detail-container {
    .detail-section {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #f0f0f0;
        &.half {
            flex: 1;
            border-bottom: none;
        }
        .detail-label {
            color: #9ca3af;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .detail-value {
            color: #374151;
            font-size: 16px;
            font-weight: 500;
            &.content-text {
                white-space: pre-wrap;
                line-height: 1.6;
            }
            .score-text {
                margin-left: 10px;
                color: #6b7280;
                font-size: 14px;
            }
        }
    }
    .detail-row {
        display: flex;
        gap: 20px;
    }
}
</style>
