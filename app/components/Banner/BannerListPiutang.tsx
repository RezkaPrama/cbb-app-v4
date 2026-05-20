import React from 'react';
import { Image, ImageBackground, ScrollView, Text, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, IMAGES, SIZES } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

// Define navigation types - sesuaikan dengan struktur navigasi Anda
type RootStackParamList = {
    ListActiveBills: undefined;
    // tambahkan route lainnya di sini
};

const BannerListPiutang: React.FC = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    return (
        <>
            {/* <TouchableOpacity>
                
            </TouchableOpacity> */}

            <ScrollView
                horizontal
                contentContainerStyle={{ paddingLeft: 15, marginBottom: 15, paddingTop: 10 }}
                showsHorizontalScrollIndicator={false}
            >
                <ImageBackground
                    source={IMAGES.eduPattern3}
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
                    <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 20, color: COLORS.white }}>List Piutang Aktif</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('ListActiveBills')}
                        style={{
                            backgroundColor: 'rgba(0,0,0,.25)',
                            paddingHorizontal: 16,
                            paddingVertical: 7,
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ ...FONTS.font, marginBottom: 2, ...FONTS.fontBold, color: COLORS.white }}>Lihat Detail </Text>
                    </TouchableOpacity>
                    <Image
                        style={{
                            width: 30,
                            height: 30,
                            resizeMode: 'contain',
                            position: 'absolute',
                            right: 26,
                            top: 20,
                        }}
                        source={IMAGES.personal}
                    />
                </ImageBackground>
            </ScrollView>
        </>
    );
};

export default BannerListPiutang;