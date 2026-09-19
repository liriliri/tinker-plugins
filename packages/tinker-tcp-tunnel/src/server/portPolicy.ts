import isInt from 'licia/isInt'

const BLOCKED_ABOVE_PRIVILEGED = new Set([
  1433, // MSSQL
  1521, // Oracle
  2049, // NFS
  2375, // Docker
  2376, // Docker TLS
  3306, // MySQL
  3389, // RDP
  5432, // PostgreSQL
  5601, // Kibana
  5672, // AMQP
  5900, // VNC
  5984, // CouchDB
  6379, // Redis
  9200, // Elasticsearch
  9300, // Elasticsearch
  11211, // Memcached
  27017, // MongoDB
])

export const DEFAULT_MAX_PORTS = 10

export function isSensitivePort(port: number): boolean {
  if (!isInt(port) || port <= 0 || port >= 65536) return true
  if (port < 1024) return true
  return BLOCKED_ABOVE_PRIVILEGED.has(port)
}
