<script setup>
import { ref, onMounted } from "vue";

const serverStatus = ref("Checking...");
const error = ref("");

onMounted(async () => {
  try {
    const response = await fetch("http://localhost:5000/api/health");

    if (!response.ok) {
      error.value = "Server request failed";
    }

    const data = await response.json();
    serverStatus.value = data.status;
  } catch (err) {
    console.log(err);
  }
});
</script>

<template>
  <h1>LeadFlow CRM</h1>

  <p>Backend status: {{ serverStatus }}</p>

  <p v-if="error">{{ error }}</p>
</template>
