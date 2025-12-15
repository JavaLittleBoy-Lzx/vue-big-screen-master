<template>
  <div class="user-management">
    <!-- 顶部导航栏 -->
    <div class="top-navbar">
      <div class="navbar-left">
        <h1 class="page-title">👥 用户管理系统</h1>
      </div>
      <div class="navbar-right">
        <span class="user-info">管理员：{{ currentUser.username }}</span>
        <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="content-wrapper">
      <!-- 操作栏 -->
      <div class="action-bar">
        <el-button type="primary" icon="el-icon-plus" @click="showAddUserDialog">添加用户</el-button>
        <div class="search-box">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索用户名..."
            @keyup.enter.native="loadUsers"
            style="width: 300px;"
          >
            <el-button slot="append" icon="el-icon-search" @click="loadUsers"></el-button>
          </el-input>
        </div>
      </div>

      <!-- 用户表格 -->
      <el-table
        :data="displayedUsers"
        stripe
        border
        style="width: 100%"
        :header-cell-style="{background:'#667eea',color:'#fff'}"
      >
        <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
        <el-table-column prop="username" label="用户名" width="150" align="center">
          <template slot-scope="scope">
            <span class="username">{{ scope.row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="getRoleType(scope.row.role)">
              {{ getRoleText(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用/禁用" width="100" align="center">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              active-color="#13ce66"
              inactive-color="#ff4949"
              @change="toggleUserStatus(scope.row)"
              :disabled="scope.row.username === 'admin'"
            >
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录时间" min-width="160" align="center">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.lastLoginTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="loginCount" label="登录次数" width="120" align="center">
          <template slot-scope="scope">
            {{ scope.row.loginCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180" align="center">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="440" fixed="right" align="center">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button size="mini" icon="el-icon-edit" @click="showEditDialog(scope.row)">编辑</el-button>
              <el-button size="mini" icon="el-icon-key" type="warning" @click="showResetPasswordDialog(scope.row)">重置</el-button>
              <el-button 
                v-if="scope.row.username !== 'admin'"
                size="mini" 
                type="danger" 
                icon="el-icon-delete"
                @click="deleteUser(scope.row)"
              >删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalUsers"
        >
        </el-pagination>
      </div>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      :title="dialogMode === 'add' ? '添加用户' : '编辑用户'"
      :visible.sync="showUserDialog"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="userForm" :rules="userRules" ref="userForm" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="userForm.username" 
            placeholder="请输入用户名"
            :disabled="dialogMode === 'edit'"
          ></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogMode === 'add'">
          <el-input 
            v-model="userForm.password" 
            type="password"
            placeholder="请输入密码（至少6位）"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="普通用户" value="user"></el-option>
            <el-option label="访客" value="guest"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="userForm.remark" 
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showUserDialog = false">取 消</el-button>
        <el-button type="primary" @click="submitUser">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      title="重置密码"
      :visible.sync="showPasswordDialog"
      width="450px"
      :close-on-click-modal="false"
    >
      <p class="info-text">为用户 <strong>{{ selectedUser.username }}</strong> 重置密码</p>
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordForm" label-width="100px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password"
            placeholder="请再次输入新密码"
            show-password
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showPasswordDialog = false">取 消</el-button>
        <el-button type="primary" @click="submitResetPassword">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { getUserInfo, clearAuth } from '@/utils/auth'

export default {
  name: 'UserManagement',
  data() {
    // 自定义密码确认验证
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }

    return {
      currentUser: {},
      userList: [],
      searchKeyword: '',
      currentPage: 1,
      pageSize: 10,
      totalUsers: 0,
      
      showUserDialog: false,
      showPasswordDialog: false,
      dialogMode: 'add', // 'add' or 'edit'
      
      userForm: {
        username: '',
        password: '',
        role: 'user',
        status: 1,
        remark: ''
      },
      
      selectedUser: {},
      passwordForm: {
        newPassword: '',
        confirmPassword: ''
      },
      
      passwordRules: {
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码至少6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  
  computed: {
    displayedUsers() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.userList.slice(start, end)
    },
    
    userRules() {
      const rules = {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ]
      }
      
      // 只在添加模式时验证密码必填
      if (this.dialogMode === 'add') {
        rules.password = [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少6位', trigger: 'blur' }
        ]
      }
      
      return rules
    }
  },
  
  mounted() {
    this.currentUser = getUserInfo() || {}
    this.loadUsers()
  },
  
  methods: {
    // 加载用户列表
    async loadUsers() {
      try {
        const response = await axios.get('http://10.100.111.2:8675/api/users/list', {
          params: {
            keyword: this.searchKeyword
          }
        })
        
        if (response.data.code === '0') {
          this.userList = response.data.data || []
          this.totalUsers = this.userList.length
          console.log('✅ 加载用户列表成功:', this.userList.length, '条')
        } else {
          this.$message.error(response.data.msg || '加载用户列表失败')
        }
      } catch (error) {
        console.error('❌ 加载用户列表失败:', error)
        this.$message.error('加载用户列表失败')
      }
    },

    // 分页处理
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
    },
    
    handleCurrentChange(val) {
      this.currentPage = val
    },

    // 显示添加用户对话框
    showAddUserDialog() {
      this.dialogMode = 'add'
      this.userForm = {
        username: '',
        password: '',
        role: 'user',
        status: 1,
        remark: ''
      }
      this.showUserDialog = true
      this.$nextTick(() => {
        this.$refs.userForm && this.$refs.userForm.clearValidate()
      })
    },

    // 显示编辑对话框
    showEditDialog(user) {
      this.dialogMode = 'edit'
      this.userForm = {
        id: user.id,
        username: user.username,
        password: '', // 编辑模式不修改密码
        role: user.role,
        status: user.status,
        remark: user.remark || ''
      }
      this.showUserDialog = true
      this.$nextTick(() => {
        this.$refs.userForm && this.$refs.userForm.clearValidate()
      })
    },

    // 提交用户表单
    submitUser() {
      this.$refs.userForm.validate(async (valid) => {
        if (!valid) return

        // 添加模式时额外检查密码
        if (this.dialogMode === 'add') {
          if (!this.userForm.password || this.userForm.password.trim() === '') {
            this.$message.error('请输入密码')
            return
          }
          if (this.userForm.password.length < 6) {
            this.$message.error('密码至少6位')
            return
          }
        }

        try {
          let response
          if (this.dialogMode === 'add') {
            // 添加模式
            console.log('📤 创建用户请求数据:', {
              username: this.userForm.username,
              password: this.userForm.password ? '***' : 'NULL',
              passwordLength: this.userForm.password ? this.userForm.password.length : 0,
              passwordType: typeof this.userForm.password,
              role: this.userForm.role,
              status: this.userForm.status
            })
            console.log('🔑 完整表单数据:', JSON.stringify(this.userForm))
            console.log('🔍 userForm.password 原始值检查:', {
              hasPassword: !!this.userForm.password,
              isEmpty: this.userForm.password === '',
              isNull: this.userForm.password === null,
              isUndefined: this.userForm.password === undefined
            })
            response = await axios.post('http://10.100.111.2:8675/api/users/create', this.userForm)
          } else {
            // 编辑模式：移除password字段
            const updateData = { ...this.userForm }
            delete updateData.password
            console.log('📤 更新用户请求数据:', updateData)
            response = await axios.put('http://10.100.111.2:8675/api/users/update', updateData)
          }

          if (response.data.code === '0') {
            this.$message.success(this.dialogMode === 'add' ? '添加成功' : '更新成功')
            this.showUserDialog = false
            this.loadUsers()
          } else {
            this.$message.error(response.data.msg || '操作失败')
          }
        } catch (error) {
          console.error('❌ 提交失败:', error)
          this.$message.error('操作失败')
        }
      })
    },

    // 显示重置密码对话框
    showResetPasswordDialog(user) {
      this.selectedUser = user
      this.passwordForm = {
        newPassword: '',
        confirmPassword: ''
      }
      this.showPasswordDialog = true
      this.$nextTick(() => {
        this.$refs.passwordForm && this.$refs.passwordForm.clearValidate()
      })
    },

    // 提交重置密码
    submitResetPassword() {
      this.$refs.passwordForm.validate(async (valid) => {
        if (!valid) return

        try {
          const response = await axios.post('http://10.100.111.2:8675/api/users/reset-password', {
            userId: this.selectedUser.id,
            newPassword: this.passwordForm.newPassword
          })

          if (response.data.code === '0') {
            this.$message.success('密码重置成功')
            this.showPasswordDialog = false
          } else {
            this.$message.error(response.data.msg || '重置失败')
          }
        } catch (error) {
          console.error('❌ 重置密码失败:', error)
          this.$message.error('重置密码失败')
        }
      })
    },

    // 切换用户状态
    async toggleUserStatus(user) {
      const newStatus = user.status
      const oldStatus = newStatus === 1 ? 0 : 1
      const action = newStatus === 1 ? '启用' : '禁用'

      try {
        const response = await axios.put('http://10.100.111.2:8675/api/users/update', {
          id: user.id,
          username: user.username,
          role: user.role,
          status: newStatus
        })

        if (response.data.code === '0') {
          this.$message.success(`${action}成功`)
          // 刷新列表以确保数据同步
          this.loadUsers()
        } else {
          this.$message.error(response.data.msg || '操作失败')
          // 操作失败，回退状态
          user.status = oldStatus
        }
      } catch (error) {
        console.error('❌ 切换状态失败:', error)
        this.$message.error('操作失败')
        // 操作失败，回退状态
        user.status = oldStatus
      }
    },

    // 删除用户
    deleteUser(user) {
      this.$confirm(`确定要删除用户 ${user.username} 吗？此操作不可恢复！`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }).then(async () => {
        try {
          const response = await axios.delete(`http://10.100.111.2:8675/api/users/delete/${user.id}`)

          if (response.data.code === '0') {
            this.$message.success('删除成功')
            this.loadUsers()
          } else {
            this.$message.error(response.data.msg || '删除失败')
          }
        } catch (error) {
          console.error('❌ 删除失败:', error)
          this.$message.error('删除失败')
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },

    // 退出登录
    handleLogout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        clearAuth()
        this.$router.push('/login')
      }).catch(() => {
        this.$message.info('已取消退出')
      })
    },

    // 格式化时间
    formatDateTime(time) {
      if (!time) return '-'
      const date = new Date(time)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    // 获取角色标签类型
    getRoleType(role) {
      const typeMap = {
        'admin': 'danger',
        'user': 'primary',
        'guest': 'warning'
      }
      return typeMap[role] || ''
    },

    // 获取角色文本
    getRoleText(role) {
      const textMap = {
        'admin': '管理员',
        'user': '普通用户',
        'guest': '访客'
      }
      return textMap[role] || role
    }
  }
}
</script>

<style scoped lang="scss">
.user-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.top-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  .page-title {
    margin: 0;
    font-size: 24px;
    color: #333;
    font-weight: 700;
  }

  .navbar-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .user-info {
      color: #666;
      font-size: 14px;
    }
  }
}

.content-wrapper {
  background: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.username {
  font-weight: 600;
  color: #667eea;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  
  .el-button {
    margin: 2px 0;
  }
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.info-text {
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

// Element UI 样式覆盖
::v-deep .el-table {
  font-size: 14px;
  
  th {
    font-weight: 600;
  }
  
  .el-button + .el-button {
    margin-left: 0;
  }
}

::v-deep .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  .el-dialog__title {
    color: #fff;
    font-weight: 600;
  }
  
  .el-dialog__headerbtn .el-dialog__close {
    color: #fff;
    
    &:hover {
      color: #fff;
    }
  }
}
</style>
