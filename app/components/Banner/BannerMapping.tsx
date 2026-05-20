import React from 'react';
import { Image, ImageBackground, ScrollView, Text, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, IMAGES, SIZES } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define navigation types
type RootStackParamList = {
    MappingToko: undefined;
    // Add other routes as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BannerMapping: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <>
            <ScrollView
                horizontal
                contentContainerStyle={{ paddingLeft: 15, marginBottom: 15, paddingTop: 10 }}
                showsHorizontalScrollIndicator={false}
            >
                <ImageBackground
                    source={IMAGES.mappingSales}
                    style={{
                        width: 330,
                        height: 85,
                        marginRight: 15,
                        borderRadius: 15,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        paddingLeft: 20,
                        paddingVertical: 20,
                        paddingRight: 120,
                        opacity: 0.8,
                        padding: 15,
                        marginBottom: 15,
                        shadowColor: "rgba(0,0,0,.6)",
                        shadowOffset: {
                            width: 0,
                            height: 4,
                        },
                        shadowOpacity: 0.30,
                        shadowRadius: 4.65,
                        elevation: 8,
                    }}
                >
                    <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 20, color: COLORS.title }}>
                        Mapping Toko
                    </Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('MappingToko')}
                        style={{
                            backgroundColor: 'rgba(0,0,0,.25)',
                            paddingHorizontal: 16,
                            paddingVertical: 7,
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ ...FONTS.font, marginBottom: 2, ...FONTS.fontBold, color: COLORS.title }}>
                            Tambah Toko Mapping
                        </Text>
                    </TouchableOpacity>
                    <Image
                        style={{
                            width: 40,
                            height: 40,
                            resizeMode: 'contain',
                            position: 'absolute',
                            right: 26,
                            top: 20,
                        }}
                        source={IMAGES.mapsIcon}
                    />
                </ImageBackground>
            </ScrollView>
        </>
    );
};

export default BannerMapping;