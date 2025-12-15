<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCategoryList, addCategory, updateCategory, deleteCategory } from '../api/category'
import type { Category } from '../types'

const categories = ref<Category[]>([])
const showModal = ref(false)
const editingCategory = ref<Partial<Category>>({})
const isEdit = ref(false)

async function loadCategories() {
  try {
    const res = await getCategoryList() as any
    if (res && res.data) {
      // 后端返回的数据只有 id 和 name，需要适配前端格式
      categories.value = (res.data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId || null,
        sort: cat.sort || cat.id || 0,
        children: cat.children || []
      }))
    }
  } catch (error) {
    console.error('Failed to load categories:', error)
    alert('加载分类列表失败')
  }
}

function handleAdd() {
  isEdit.value = false
  editingCategory.value = {
    name: ''
    // 后端只支持 name 字段，parentId 和 sort 暂时不支持
  }
  showModal.value = true
}

function handleEdit(category: Category) {
  isEdit.value = true
  editingCategory.value = { ...category }
  showModal.value = true
}

async function handleDelete(id: number) {
  if (!confirm('确认删除该分类？')) return

  try {
    await deleteCategory(id)
    alert('删除成功')
    loadCategories()
  } catch (error: any) {
    console.error('Failed to delete category:', error)
    const errorMessage = error.response?.data?.message || error.message || '删除失败'
    alert(errorMessage)
  }
}

async function handleSave() {
  if (!editingCategory.value.name) {
    alert('请填写分类名称')
    return
  }

  try {
    // 只发送后端支持的字段
    const categoryData = {
      name: editingCategory.value.name
    }
    
    if (isEdit.value && editingCategory.value.id) {
      await updateCategory(editingCategory.value.id, categoryData)
      alert('更新成功')
    } else {
      await addCategory(categoryData)
      alert('添加成功')
    }
    showModal.value = false
    loadCategories()
  } catch (error: any) {
    console.error('Failed to save category:', error)
    const errorMessage = error.response?.data?.message || error.message || '保存失败'
    alert(errorMessage)
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div class="categories">
    <div class="page-header">
      <h2 class="page-title">分类管理</h2>
      <button class="btn btn-primary" @click="handleAdd">新增分类</button>
    </div>

    <div class="table-container card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>分类名称</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td>{{ category.id }}</td>
            <td>{{ category.name || '-' }}</td>
            <td>
              <button class="btn-text" @click="handleEdit(category)">编辑</button>
              <button class="btn-text btn-danger" @click="handleDelete(category.id)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ isEdit ? '编辑分类' : '新增分类' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">分类名称</label>
            <input v-model="editingCategory.name" type="text" class="form-input" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
}

.btn-text {
  background: none;
  color: var(--color-primary);
  padding: 4px 8px;
  margin-right: var(--spacing-sm);
}

.btn-text.btn-danger {
  color: var(--color-error);
}

.modal-body {
  padding: var(--spacing-md) 0;
}
</style>
