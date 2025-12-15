<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  getProductList,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus
} from '../api/product'
import { getCategoryList } from '../api/category'
import type { Product, Category } from '../types'

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')

const showModal = ref(false)
const editingProduct = ref<Partial<Product>>({})
const isEdit = ref(false)

async function loadProducts() {
  try {
    const res = await getProductList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    }) as any
    if (res && res.data) {
      products.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('Failed to load products:', error)
    alert('加载商品列表失败')
  }
}

async function loadCategories() {
  try {
    const res = await getCategoryList() as any
    categories.value = res.data
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

function handleSearch() {
  page.value = 1
  loadProducts()
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadProducts()
}

function handleAdd() {
  isEdit.value = false
  editingProduct.value = {
    name: '',
    categoryId: categories.value[0]?.id,
    price: 0,
    stock: 0,
    status: 'on',
    description: ''
  }
  showModal.value = true
}

function handleEdit(product: Product) {
  isEdit.value = true
  editingProduct.value = { ...product }
  showModal.value = true
}

async function handleDelete(id: number) {
  if (!confirm('确认删除该商品？')) return

  try {
    await deleteProduct(id)
    alert('删除成功')
    loadProducts()
  } catch (error: any) {
    console.error('Failed to delete product:', error)
    const errorMessage = error.response?.data?.message || error.message || '删除失败'
    alert(errorMessage)
  }
}

async function handleSave() {
  if (!editingProduct.value.name || !editingProduct.value.categoryId) {
    alert('请填写完整信息')
    return
  }

  try {
    if (isEdit.value && editingProduct.value.id) {
      await updateProduct(editingProduct.value.id, editingProduct.value)
      alert('更新成功')
    } else {
      // 新增时不需要 category 字段，后端会根据 categoryId 查询
      await addProduct(editingProduct.value)
      alert('添加成功')
    }
    showModal.value = false
    loadProducts()
  } catch (error: any) {
    console.error('Failed to save product:', error)
    const errorMessage = error.response?.data?.message || error.message || '保存失败'
    alert(errorMessage)
  }
}

async function handleStatusChange(product: Product) {
  const newStatus = product.status === 'on' ? 'off' : 'on'
  try {
    await updateProductStatus(product.id, newStatus)
    product.status = newStatus
    alert('状态更新成功')
  } catch (error: any) {
    console.error('Failed to update status:', error)
    const errorMessage = error.response?.data?.message || error.message || '状态更新失败'
    alert(errorMessage)
    // 恢复原状态
    product.status = product.status === 'on' ? 'off' : 'on'
  }
}

function getTotalPages() {
  return Math.ceil(total.value / pageSize.value)
}

onMounted(() => {
  loadProducts()
  loadCategories()
})
</script>

<template>
  <div class="products">
    <div class="page-header">
      <h2 class="page-title">商品管理</h2>
    </div>

    <div class="toolbar card">
      <div class="search-box">
        <input
          v-model="keyword"
          type="text"
          class="form-input"
          placeholder="搜索商品名称"
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-primary" @click="handleSearch">搜索</button>
      </div>
      <button class="btn btn-primary" @click="handleAdd">新增商品</button>
    </div>

    <div class="table-container card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>商品名称</th>
            <th>分类</th>
            <th>价格</th>
            <th>库存</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.id }}</td>
            <td>{{ product.name || '-' }}</td>
            <td>{{ product.category || '-' }}</td>
            <td>¥{{ product.price?.toFixed(2) || '0.00' }}</td>
            <td>{{ product.stock || 0 }}</td>
            <td>
              <label class="switch">
                <input
                  type="checkbox"
                  :checked="product.status === 'on'"
                  @change="handleStatusChange(product)"
                />
                <span class="slider"></span>
              </label>
            </td>
            <td>
              <button class="btn-text" @click="handleEdit(product)">编辑</button>
              <button class="btn-text btn-danger" @click="handleDelete(product.id)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button :disabled="page === 1" @click="handlePageChange(page - 1)">上一页</button>
        <span>第 {{ page }} / {{ getTotalPages() }} 页</span>
        <button :disabled="page >= getTotalPages()" @click="handlePageChange(page + 1)">
          下一页
        </button>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ isEdit ? '编辑商品' : '新增商品' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">商品名称</label>
            <input v-model="editingProduct.name" type="text" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="editingProduct.categoryId" class="form-input">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">价格</label>
            <input v-model.number="editingProduct.price" type="number" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">库存</label>
            <input v-model.number="editingProduct.stock" type="number" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">状态</label>
            <select v-model="editingProduct.status" class="form-input">
              <option value="on">上架</option>
              <option value="off">下架</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea v-model="editingProduct.description" class="form-input" rows="3"></textarea>
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
.products {
  max-width: 1400px;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.search-box {
  display: flex;
  gap: var(--spacing-sm);
}

.search-box .form-input {
  width: 300px;
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

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.modal-body {
  max-height: 500px;
  overflow-y: auto;
}
</style>
