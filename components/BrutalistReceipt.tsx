import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BrutalistReceiptProps {
  children: React.ReactNode;
  className?: string;
}

export const BrutalistReceipt: React.FC<BrutalistReceiptProps> = ({ children, className }) => {
  const padding = 24;
  const receiptWidth = SCREEN_WIDTH - (padding * 2);
  const jagSize = 10;
  const jagHeight = 12;
  const totalWidth = receiptWidth + 8; // Including borders
  const jagCount = Math.floor(totalWidth / (jagSize * 2));
  
  // Create the path for the jagged bottom
  let jagPath = `M 0 0`;
  for (let i = 0; i < jagCount; i++) {
    const x1 = i * 2 * jagSize + jagSize;
    const x2 = (i + 1) * 2 * jagSize;
    jagPath += ` L ${x1} ${jagHeight} L ${x2} 0`;
  }
  jagPath += ` L ${totalWidth} 0 L ${totalWidth} ${jagHeight} L 0 ${jagHeight} Z`;

  return (
    <View className="mb-10">
      {/* Shadow layer */}
      <View 
        className="absolute bg-black"
        style={{
          top: 8,
          left: 8,
          right: -8,
          bottom: -8,
        }}
      />
      
      {/* Main Content */}
      <View className={`bg-white border-[4px] border-black p-6 ${className}`}>
        {children}
        
        {/* Jagged Bottom */}
        <View 
          style={{ 
            position: 'absolute', 
            bottom: -jagHeight - 3, 
            left: -4, 
            width: totalWidth,
            height: jagHeight + 4,
          }}
        >
          <Svg width={totalWidth} height={jagHeight + 4} viewBox={`0 0 ${totalWidth} ${jagHeight + 4}`}>
            {/* Shadow for jagged edge */}
            <Path
              d={`M 8 4 ${jagPath}`}
              fill="black"
              transform="translate(4, 4)"
            />
            {/* White jagged edge */}
            <Path
              d={jagPath}
              fill="white"
              stroke="black"
              strokeWidth="4"
            />
          </Svg>
        </View>
      </View>
    </View>
  );
};
