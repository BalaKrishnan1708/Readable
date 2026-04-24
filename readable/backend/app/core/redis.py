import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings


_fallback_cache: dict[str, str] = {}
_redis_client: Redis | None = None


async def get_redis_client() -> Redis | None:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
            await _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client


async def cache_json(key: str, value: dict[str, Any], ttl_seconds: int = 3600) -> None:
    client = await get_redis_client()
    serialized = json.dumps(value)
    if client is None:
        _fallback_cache[key] = serialized
        return
    await client.set(key, serialized, ex=ttl_seconds)


async def get_cached_json(key: str) -> dict[str, Any] | None:
    client = await get_redis_client()
    raw = _fallback_cache.get(key) if client is None else await client.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def delete_cached_value(key: str) -> None:
    client = await get_redis_client()
    if client is None:
        _fallback_cache.pop(key, None)
        return
    await client.delete(key)
