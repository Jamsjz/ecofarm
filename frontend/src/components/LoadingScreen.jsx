import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';

export default function LoadingScreen() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{ width: '300px', height: '300px' }}>
                <DotLottiePlayer
                    src="https://assets-v2.lottiefiles.com/a/839fe9f2-1181-11ee-8d9c-ab00d840e1f7/esZsyzRPxl.lottie"
                    loop
                    autoplay
                />
            </div>
        </div>
    );
}
