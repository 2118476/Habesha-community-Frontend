# Messages Deep-Link & Mobile UX Patch

1) Add a thread route (if not already present):

```jsx
<Route path="/app/messages/thread/:threadId" element={<Messages />} />
```

2) In your `Messages` component (top of the file):

```jsx
import { useAutoSelectThreadFromRoute } from '../../patches/messages/useAutoSelectThreadFromRoute';

export default function Messages() {
  useAutoSelectThreadFromRoute({
    selectThread: yourSelectThreadFn,
    fetchThreadIfMissing: yourFetchThreadFn,
  });
  ...
}
```

3) When you render an "Message" button next to a user/post, use:

```jsx
import { ensureThreadAndNavigate } from '../../utils/ensureThreadAndNavigate';
// or the hook:
import { useThreadByUser } from '../../hooks/useThreadByUser';
```

4) Mobile: add a **Back** button in the conversation header that clears the open state
and apply class `.messagesMobileBack` from `MessagesMobilePatch.module.css`.
