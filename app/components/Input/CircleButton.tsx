import { Feather } from "@expo/vector-icons";
import { FontAwesome5 } from '@expo/vector-icons';
import React from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import * as Animatable from 'react-native-animatable';
import { Platform } from 'react-native';

interface CircleButtonProps {
  icon: string;
  text: string;
  onPress: () => void;
  animating?: boolean;
}

const CircleButton: React.FC<CircleButtonProps> = ({ icon, text, onPress, animating }) => {
  return (
    <Animatable.View
      animation={animating ? "bounceIn" : undefined}
      iterationCount={animating ? "infinite" : 1}
      direction="alternate"
    >
      <View style={styles.cardButton}>
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <FontAwesome5 name={icon} size={24} color="#1A7347" />
          {/* <Feather name={icon} size={24} color="#1A7347" /> */}
          <Text style={styles.text}>{text}</Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 90,
    height: 90,
    borderRadius: 80,
    backgroundColor: "#CFF4FC",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "black",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardButton: {
    marginLeft: 4,
    marginTop: 10,
  },
  text: {
    marginTop: 5,
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#1A7347",
  },
});

export default CircleButton;