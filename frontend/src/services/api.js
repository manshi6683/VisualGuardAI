
const API_BASE_URL = 'http://localhost:5000/api'

export async function getScanHistory() {
    const response = await fetch(`${API_BASE_URL}/history`)

    const result = await response.json()

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load scan history')
    }

    return result.data
}

export async function getScanDetails(id) {
    const response = await fetch(`${API_BASE_URL}/history/${id}`)

    const result = await response.json()

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load scan details')
    }

    return result.data
}

export async function deleteScan(id) {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: 'DELETE'
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete scan')
    }

    return result
}
