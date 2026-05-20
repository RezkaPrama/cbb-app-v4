import React from 'react';
import { Text, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';

// Types
interface HeaderStyle1Props {
  drawer?: () => void;
  title?: string;
  notif?: number | string;
  rightIcon?: string;
}

const HeaderStyle1: React.FC<HeaderStyle1Props> = (props) => {
  const { colors } = useTheme();

  return (
    <>
      <View style={styles.container(colors)}>
        <TouchableOpacity
          onPress={() => props.drawer && props.drawer()}
          style={styles.iconButton}
        >
          <FeatherIcon color={COLORS.title} name='menu' size={18} />
        </TouchableOpacity>
        
        <Text style={[FONTS.h6 as TextStyle, { color: COLORS.title, flex: 1 }]}>
          {props.title}
        </Text>
        
        <TouchableOpacity style={styles.iconButton}>
          <FeatherIcon color={COLORS.title} name='search' size={20} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton}>
          {props.notif !== undefined && props.notif !== null && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {props.notif}
              </Text>
            </View>
          )}
          <FeatherIcon color={COLORS.title} name='bell' size={20} />
        </TouchableOpacity>
      </View>
    </>
  );
};

// Styles
const styles = {
  container: (colors: any): ViewStyle => ({
    height: 50,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    shadowColor: "rgba(0,0,0,.6)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  }),
  iconButton: {
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  badge: {
    height: 18,
    width: 18,
    borderRadius: 20,
    position: 'absolute',
    top: 7,
    right: 10,
    zIndex: 1,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  badgeText: {
    ...FONTS.fontXs,
    color: COLORS.white,
    ...FONTS.fontBold,
    lineHeight: 17,
  } as TextStyle,
};

export default HeaderStyle1;