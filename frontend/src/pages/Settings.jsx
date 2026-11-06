import { useState } from 'react'
import { Settings as SettingsIcon, User, Bell, Shield, Save } from 'lucide-react'

function Settings({ onSave }) {
    const [settings, setSettings] = useState({
        username: 'QA Tester',
        email: '',
        notifications: true,
        autoSave: true,
    })

    const handleChange = (key, value) => {
        setSettings((previous) => ({
            ...previous,
            [key]: value,
        }))
    }
    const handleSave = () => {
        onSave(settings.username)
        alert('Settings saved successfully!')
    }

    return (
        <section className="scanner-panel">
            <div className="panel-heading">
                <div>
                    <div className="section-kicker">
                        <SettingsIcon size={14} /> CONFIGURATION
                    </div>
                    <h2>Workspace Settings</h2>
                    <p>Manage your VisualGuard AI preferences.</p>
                </div>
            </div>

            <div className="settings-section">
                <h3><User size={18} /> Profile Settings</h3>

                <label>Username</label>
                <input
                    value={settings.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                />

                <label>Email</label>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                />
            </div>

            <div className="settings-section">
                <h3><Bell size={18} /> Preferences</h3>

                <label>
                    <input
                        type="checkbox"
                        checked={settings.notifications}
                        onChange={(e) => handleChange('notifications', e.target.checked)}
                    />
                    Enable notifications
                </label>

                <label>
                    <input
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={(e) => handleChange('autoSave', e.target.checked)}
                    />
                    Enable automatic saving
                </label>
            </div>

            <button className="neon-button" onClick={handleSave}>
                <Save size={16} /> Save Settings
            </button>
        </section>
    )
}

export default Settings