import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { RootStackParamList } from '../../navigations/Route';
import { login } from '../../redux/Store/Store';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { storeDataLara } from '../../utils/asyncStorage';
import { COLORS, FONTS, IMAGES, ICONS } from '../../constants/theme';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

interface LoginResponse {
  success: boolean;
  access_token: string;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
    // const [username, setUsername] = useState<string>('rezkaprama');
    // const [password, setPassword] = useState<string>('23November');
  const [passwordShow, setPasswordShow] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleShowPassword = (): void => {
    setPasswordShow(!passwordShow);
  };

  const handleLogin = async (): Promise<void> => {
    setIsLoading(true);

    // Input validation
    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Login Gagal',
        text2: 'Username dan password harus diisi!',
      });
      setIsLoading(false);
      return;
    }

    try {
      // Use FormData as the API expects form data
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      // Make the API request
      const response = await axios.post<LoginResponse>(
        'https://citrabarubusana.org/api/login',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Check if login is successful
      if (response.data.success === true && response.data.access_token) {
        const token = response.data.access_token;
        const userData = response.data.user;

        // Save token and user data to storage
        await storeDataLara('tokenUser', token);
        await storeDataLara('dataDetailUser', userData);

        // Update Redux store - Navigation akan otomatis terjadi via conditional rendering
        dispatch(
          login({
            user: userData,
            token: token,
          })
        );

        Toast.show({
          type: 'success',
          text1: 'Login Berhasil',
          text2: `Selamat datang, ${userData.name || userData.username}!`,
        });

        // Jangan manual navigate, biarkan Routes.tsx handle via isAuthenticated state
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Gagal',
          text2: 'Format respons tidak sesuai',
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'Periksa koneksi internet anda!';

      if (error.response) {
        console.log('Error response:', error.response.data);
        errorMessage = error.response.data.message || 'Kredensial tidak valid!';
      }

      Toast.show({
        type: 'error',
        text1: 'Login Gagal',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0539BE', '#022685', '#00215C']}
        start={{ x: 0.0, y: 0.25 }}
        end={{ x: 0.5, y: 1.0 }}
        style={styles.gradient}
      >
        {/* Background Decorative Circles */}
        <LinearGradient
          colors={['#1E5AF4', '#00215C']}
          style={styles.circle1}
        />
        <LinearGradient
          colors={['#1152DE', '#00215C']}
          style={styles.circle2}
        />
        <LinearGradient
          colors={['#0539BE', '#022685']}
          style={styles.circle3}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          )}

          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#F7F5FF', 'rgba(255,255,255,0)']}
                style={styles.logoCircle1}
              />
              <LinearGradient
                colors={['#F7F5FF', 'rgba(255,255,255,0)']}
                style={styles.logoCircle2}
              />
              <Image
                style={styles.logo}
                source={IMAGES.cbb1}
                resizeMode="contain"
              />
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.formContent}>
                <Text style={styles.title}>Log in</Text>

                {/* Username Input */}
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <SvgXml xml={ICONS.user} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    placeholderTextColor="rgba(255,255,255,.6)"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <SvgXml xml={ICONS.lock} />
                  </View>
                  <TextInput
                    secureTextEntry={passwordShow}
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="rgba(255,255,255,.6)"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={handleShowPassword}
                    style={styles.eyeIcon}
                    disabled={isLoading}
                  >
                    <SvgXml
                      xml={passwordShow ? ICONS.eyeClose : ICONS.eyeOpen}
                    />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                {/* <View style={styles.forgotPasswordContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Lupa password?
                    </Text>
                  </TouchableOpacity>
                </View> */}

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Loading...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>

                {/* Register Link */}
                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={() => navigation.navigate('Register')}
                  disabled={isLoading}
                >
                  <Text style={styles.registerText}>
                    Belum punya akun?{' '}
                    <Text style={styles.registerTextBold}>Daftar</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  circle1: {
    height: 180,
    width: 180,
    borderRadius: 180,
    position: 'absolute',
    bottom: '23%',
    right: -70,
  },
  circle2: {
    height: 132,
    width: 132,
    borderRadius: 132,
    position: 'absolute',
    bottom: -25,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    height: 400,
    width: 600,
    borderRadius: 42,
    left: -360,
    top: 50,
    transform: [{ rotate: '-35deg' }],
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    zIndex: 1,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.3)',
  },
  keyboardView: {
    flex: 1,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    position: 'relative',
  },
  logoCircle1: {
    height: 135,
    width: 135,
    borderRadius: 135,
    position: 'absolute',
    top: 20,
    right: -50,
    transform: [{ rotate: '-120deg' }],
  },
  logoCircle2: {
    height: 135,
    width: 135,
    borderRadius: 135,
    position: 'absolute',
    bottom: 0,
    left: -50,
    transform: [{ rotate: '120deg' }],
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 10,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,.09)',
    padding: 30,
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  formContent: {
    paddingTop: 5,
  },
  title: {
    ...FONTS.h2,
    textAlign: 'center',
    color: COLORS.white,
    marginBottom: 30,
  },
  inputWrapper: {
    marginBottom: 15,
    position: 'relative',
  },
  inputIcon: {
    height: 40,
    width: 40,
    borderRadius: 10,
    position: 'absolute',
    left: 10,
    top: 5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    ...FONTS.fontLg,
    height: 50,
    paddingLeft: 60,
    paddingRight: 50,
    borderWidth: 1,
    borderRadius: 10,
    color: COLORS.white,
    backgroundColor: 'rgba(255,255,255,.05)',
    borderColor: 'rgba(255,255,255,.3)',
  },
  eyeIcon: {
    position: 'absolute',
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,.7)',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: COLORS.white,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#0539BE',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  registerText: {
    color: 'rgba(255,255,255,.7)',
    fontSize: 14,
  },
  registerTextBold: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default LoginScreen;