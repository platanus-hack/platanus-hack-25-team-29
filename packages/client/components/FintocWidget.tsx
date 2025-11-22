/**
 * Fintoc Widget Component
 * Handles bank account connection through Fintoc widget
 */

import React, { useState, useEffect } from 'react';

// Extend Window interface for Fintoc SDK
declare global {
    interface Window {
        Fintoc?: {
            create: (config: FintocConfig) => FintocWidget;
        };
    }
}

interface FintocConfig {
    holderType: string;
    product: string;
    publicKey: string;
    webhookUrl: string;
    country: string;
    onSuccess?: (data: any) => void;
    onExit?: () => void;
    onEvent?: (event: any) => void;
}

interface FintocWidget {
    open: () => void;
    destroy: () => void;
}

interface WidgetConfigResponse {
    data: {
        public_key: string;
        webhook_url: string;
        holder_type: string;
        product: string;
        country: string;
    };
}

interface FintocWidgetProps {
    apiBaseUrl?: string;
    userId?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

const FintocWidget: React.FC<FintocWidgetProps> = ({
    apiBaseUrl = 'http://localhost:8000/api/fintoc',
    userId,
    onSuccess,
    onError
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [widgetInstance, setWidgetInstance] = useState<FintocWidget | null>(null);

    // Cleanup widget on unmount
    useEffect(() => {
        return () => {
            if (widgetInstance) {
                try {
                    widgetInstance.destroy();
                } catch (e) {
                    console.warn('Could not destroy widget:', e);
                }
            }
        };
    }, [widgetInstance]);

    const loadFintocSDK = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.Fintoc && typeof window.Fintoc.create === 'function') {
                console.log('✅ Fintoc SDK already loaded');
                resolve();
                return;
            }

            // Check if script is already being loaded
            const existingScript = document.querySelector('script[src="https://js.fintoc.com/v1/"]');
            if (existingScript) {
                console.log('⏳ Fintoc SDK script already exists, waiting for load...');
                const checkInterval = setInterval(() => {
                    if (window.Fintoc && typeof window.Fintoc.create === 'function') {
                        clearInterval(checkInterval);
                        console.log('✅ Fintoc SDK initialized and ready');
                        resolve();
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (!window.Fintoc) {
                        reject(new Error('Fintoc SDK loading timeout'));
                    }
                }, 10000);
                return;
            }

            // Load the script
            console.log('📥 Creating script tag for Fintoc SDK');
            const script = document.createElement('script');
            script.src = 'https://js.fintoc.com/v1/';
            script.async = true;

            script.onload = () => {
                console.log('✅ Fintoc SDK script loaded successfully');
                // Wait for Fintoc to be available
                const checkInterval = setInterval(() => {
                    if (window.Fintoc && typeof window.Fintoc.create === 'function') {
                        clearInterval(checkInterval);
                        console.log('✅ Fintoc SDK initialized and ready');
                        resolve();
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (!window.Fintoc) {
                        reject(new Error('Fintoc SDK loaded but not initialized'));
                    }
                }, 10000);
            };

            script.onerror = (error) => {
                console.error('❌ Failed to load Fintoc SDK script:', error);
                reject(new Error('Failed to load Fintoc SDK'));
            };

            document.body.appendChild(script);
        });
    };

    const fetchWidgetConfig = async (): Promise<WidgetConfigResponse> => {
        const url = userId 
            ? `${apiBaseUrl}/widget-config?user_id=${userId}`
            : `${apiBaseUrl}/widget-config`;
        
        console.log('📡 Fetching widget config from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to fetch widget configuration');
        }
        
        return response.json();
    };

    const initializeFintocWidget = async (config: WidgetConfigResponse['data']) => {
        try {
            console.log('🔧 Initializing Fintoc widget with config:', {
                holderType: config.holder_type,
                product: config.product,
                publicKey: config.public_key ? `${config.public_key.substring(0, 10)}...` : 'MISSING',
                webhookUrl: config.webhook_url ? '✓ Present' : 'MISSING',
                country: config.country
            });

            // Validate required config
            if (!config.public_key) {
                throw new Error('Public key is missing from widget configuration');
            }
            if (!config.webhook_url) {
                throw new Error('Webhook URL is missing from widget configuration');
            }

            // Load Fintoc SDK if not already loaded
            if (!window.Fintoc) {
                console.log('📥 Loading Fintoc SDK...');
                await loadFintocSDK();
                console.log('✅ Fintoc SDK loaded');
            }

            if (!window.Fintoc) {
                throw new Error('Fintoc SDK failed to load');
            }

            // Destroy existing widget instance if any
            if (widgetInstance) {
                try {
                    widgetInstance.destroy();
                } catch (error) {
                    console.warn('Warning: Could not destroy previous widget instance:', error);
                }
            }

            console.log('🎨 Creating widget...');
            const widget = window.Fintoc.create({
                holderType: config.holder_type,
                product: config.product,
                publicKey: config.public_key,
                webhookUrl: config.webhook_url,
                country: config.country,
                onSuccess: (link: any) => {
                    console.log('✅ Widget success callback triggered:', link);
                    setWidgetInstance(null);
                    setError('');
                    
                    // Call parent success callback
                    if (onSuccess) {
                        onSuccess();
                    }
                    
                    // Show success message
                    alert('¡Cuenta bancaria conectada exitosamente! Los datos se están sincronizando.');
                },
                onExit: () => {
                    console.log('👋 Widget exited');
                    setWidgetInstance(null);
                    setIsLoading(false);
                },
                onEvent: (event: any) => {
                    console.log('📊 Widget event:', event);
                }
            });

            // Store widget instance
            setWidgetInstance(widget);

            console.log('🚀 Opening widget...');
            widget.open();
            console.log('✅ Widget opened successfully');
            
        } catch (error: any) {
            console.error('❌ Failed to initialize Fintoc widget:', error);
            setWidgetInstance(null);
            const errorMessage = error?.message || 'Unknown error occurred';
            setError(`Error loading Fintoc widget: ${errorMessage}`);
            
            if (onError) {
                onError(errorMessage);
            }
        }
    };

    const handleConnectBankAccount = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            console.log('🚀 Starting bank account connection...');
            
            // Fetch widget configuration
            const response = await fetchWidgetConfig();
            
            if (response.data) {
                await initializeFintocWidget(response.data);
            } else {
                throw new Error('Widget configuration not available');
            }
            
        } catch (error: any) {
            console.error('❌ Error connecting bank account:', error);
            const message = error?.message || 'Failed to load widget configuration';
            setError(message);
            
            if (onError) {
                onError(message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fintoc-widget-container">
            <button
                onClick={handleConnectBankAccount}
                disabled={isLoading}
                className="connect-bank-button"
                style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: '#4F46E5',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.2s'
                }}
            >
                {isLoading ? '⏳ Cargando...' : '🏦 Conectar Cuenta Bancaria'}
            </button>
            
            {error && (
                <div 
                    className="error-message"
                    style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        borderRadius: '6px',
                        fontSize: '14px'
                    }}
                >
                    ❌ {error}
                </div>
            )}
        </div>
    );
};

export default FintocWidget;