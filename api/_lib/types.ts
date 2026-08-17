// Vercel Node 함수의 req/res는 @vercel/node 없이도 이 정도 타입으로 충분히 다룰 수 있다.
// (무거운 @vercel/node를 devDependency로 끌어오지 않기 위해 최소 타입만 직접 선언한다.)
export interface ApiRequest {
  method?: string
  body?: unknown
}

export interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
}
