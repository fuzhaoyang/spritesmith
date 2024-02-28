<template>
    <div class="app">
         <h2>上传图片</h2>
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="image">
            <button type="submit">上传</button>
        </form>
        <div class="icon-APP_manager"></div>
    </div>
</template>
<style scoped>
    @import './assets/sprite.css';
</style>
<script>
    export default {
        data() {
            return {}
        },
        components: {}
    }
</script>
