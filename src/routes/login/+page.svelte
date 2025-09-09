<script>
  import { enhance } from '$app/forms';

  /** @type {import('./$types').ActionData} */
  export let form;
</script>

<svelte:head>
  <title>Login | AI Chatbot</title>
</svelte:head>

<div class="flex items-center justify-center min-h-screen bg-gray-100 font-family: 'Inter', sans-serif;">
  <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">

    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-800">Welcome Back</h1>
      <p class="mt-2 text-sm text-gray-500">Please sign in to access your AI Chatbot</p>
    </div>

    <form method="POST" use:enhance class="space-y-6">
      <div>
        <label for="username" class="text-sm font-medium text-gray-700">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          class="w-full px-3 py-2 mt-1 text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Enter your username"
        />
      </div>

      <div>
        <label for="password" class="text-sm font-medium text-gray-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          class="w-full px-3 py-2 mt-1 text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Enter your password"
        />
      </div>

      {#if form?.error}
        <p class="text-sm text-center text-red-500">{form.error}</p>
      {/if}

      <div>
        <button
          type="submit"
          class="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
        >
          Sign In
        </button>
      </div>
    </form>

  </div>
</div>
