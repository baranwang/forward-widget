import { initializeFetchAdapter, initializeFetchStorageAdapter } from "@forward-widget/libs-fetch";
import { storage } from "@forward-widget/libs-storage";

initializeFetchAdapter({
  get: Widget.http.get.bind(Widget.http),
  post: Widget.http.post.bind(Widget.http),
});

initializeFetchStorageAdapter(storage);

export * from "@forward-widget/libs-fetch";
