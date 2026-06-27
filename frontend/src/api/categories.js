import client from "./client";

export async function fetchCategories() {
  const { data } = await client.get("/categories");
  return data;
}

export async function saveCategory(payload, categoryId) {
  const { data } = categoryId
    ? await client.put(`/categories/${categoryId}`, payload)
    : await client.post("/categories", payload);
  return data;
}
