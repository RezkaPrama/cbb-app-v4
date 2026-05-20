import React from 'react';
import { Text, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface ButtonLight4Props {
    title: string;
    onPress?: () => void;
    color?: string;
    btnSquare?: boolean;
    btnRounded?: boolean;
    style?: StyleProp<ViewStyle>;
    icon?: string;
}

const ButtonLight4: React.FC<ButtonLight4Props> = ({
    title,
    onPress,
    color,
    btnSquare = false,
    btnRounded = false,
    style,
    icon
}) => {
    const getBorderRadius = (): number => {
        if (btnSquare) return 0;
        if (btnRounded) return 30;
        return SIZES.radius;
    };

    const backgroundColor = color || COLORS.primary5;
    const textColor = color || COLORS.title;

    return (
        <View style={{ position: 'relative' }}>
            <View
                style={{
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                    borderRadius: getBorderRadius(),
                    backgroundColor: backgroundColor,
                    opacity: 0.2,
                }}
            />
            <TouchableOpacity
                onPress={onPress}
                style={[
                    {
                        paddingHorizontal: 15,
                        paddingVertical: 12,
                        alignItems: 'center',
                    },
                    style
                ]}
            >
                {icon && (
                    <FontAwesome5 
                        name={icon} 
                        size={12} 
                        color={textColor} 
                        style={{ marginRight: 8 }} 
                    />
                )}
                <Text style={[{ ...FONTS.fontSm, color: textColor }]}>
                    {title}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default ButtonLight4;