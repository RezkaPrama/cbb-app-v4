import { Dimensions } from "react-native";
const {width,height} = Dimensions.get('screen');

export const COLORS = {
	primary : "#FE9063",
	primary2 : "#14b987",
	primary3 : "#337bff",
	primary4 : "#ff50a2",
	primary5 : "#577bff",
	primary6 : "#4053FF",
	primary7 : "#00AB8C",
	yellow  : "#FFCD90",
	secondary : "#704FFE",
	success : "#54D969",
	danger  : "#ff4a5c",
	warning : "#ffb02c",
	white   : "#fff",
	info : "#4cb1ff",
	text : "rgba(0,0,0,.7)",
	primayLight : "rgba(255,144,99,.13)",
	primayLight2 : "rgba(0,196,132,.12)",
	primayLight3 : "rgba(51,123,255,.15)",
	primayLight4 : "rgba(255,80,162,.2)",
	primayLight5 : "rgba(87,123,255,.2)",
	textLight : "rgba(0,0,0,.5)",
	title : "#2F2F2F",
	dark : "#2f2f2f",
	light : "#E6E6E6",
	borderColor : "#E6E6E6",
	borderColor2: "#282828",
	darkBorder : "rgba(255, 255, 255, 0.2)",
	darkBg : "#2c3f6d",
	placeholderColor : "#646464",
	red : "#f85c6f",
	redLight : "rgba(248,92,111,.2)",
	themePrimary : "#1630C2",
	themeSecondary : "#FF74B9",
	background2 : '#f5f5f5',
	backgroundColor: 'rgba(255, 255, 255, 0.95)',
	cardBg : "#0c1746"
}

export const SIZES = {
	fontLg:16,
    font:14,
	fontSm:13,
	fontXs:12,

	//radius
    radius_sm:8,
    radius:12,
	radius_md:18,

	//space
	padding:15,
	margin:15,

    //Font Sizes
    h1:40,
    h2:28,
    h3:24,
    h4:20,
    h5:18,
	h6:16,
	h7:14,

    //App dimensions
    width,
    height,
	
};

export const FONTS = {

	// fontPoppins : {fontFamily:'Poppins-SemiBold'},
	// fontNunito : {fontFamily:'NunitoSans-Regular'},
	'fontPoppins': require('../assets/fonts/Poppins-SemiBold.ttf'), 
	'fontNunito': require('../assets/fonts/NunitoSans-Regular.ttf'), 

	'NunitoSans-Bold': require('../assets/fonts/NunitoSans-Bold.ttf'), 
	'NunitoSans-Regular': require('../assets/fonts/NunitoSans-Regular.ttf'), 
	'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'), 

    fontLg   : {fontSize:SIZES.fontLg,color: COLORS.text, lineHeight:20, fontFamily:'NunitoSans-Bold'},
    font   : {fontSize:SIZES.font,color: COLORS.text, lineHeight:20, fontFamily:'NunitoSans-Regular'},
	fontSm : {fontSize:SIZES.fontSm,color: COLORS.text, lineHeight:18, fontFamily:'NunitoSans-Regular'},
	fontMd : {fontSize:SIZES.fontSm,color: COLORS.text, lineHeight:16, fontFamily:'NunitoSans-Regular'},
	fontXs : {fontSize:SIZES.fontXs,color: COLORS.text, lineHeight:14, fontFamily:'NunitoSans-Regular'},
    h1     : {fontSize:SIZES.h1, color:COLORS.title, fontFamily:'Poppins-SemiBold'},
    h2     : {fontSize:SIZES.h2, color:COLORS.title, fontFamily:'Poppins-SemiBold'},
    h3     : {fontSize:SIZES.h3, color:COLORS.title, fontFamily:'Poppins-SemiBold'},
    h4     : {fontSize:SIZES.h4, color:COLORS.title, fontFamily:'Poppins-SemiBold'},
    h5     : {fontSize:SIZES.h5, color:COLORS.title, fontFamily:'Poppins-SemiBold'},
    h6     : {fontSize:SIZES.h6, color:COLORS.title, fontFamily:'Poppins-SemiBold'},
    h7     : {fontSize:SIZES.h7, color:COLORS.title, fontFamily:'Poppins-SemiBold'},

	// fontBold : {fontFamily:'NunitoSans-Bold'},
	'fontBold': require('../assets/fonts/NunitoSans-Regular.ttf'),

}

export const IMAGES = {

	cbb1 : require('../assets/images/global/LogoVer.png'),
	user : require('../assets/images/global/stories/small/user.png'),
	eduPattern1 : require('../assets/images/pattern/pattern1.png'),
	eduPattern2 : require('../assets/images/pattern/pattern2.png'),
	eduPattern3 : require('../assets/images/pattern/pattern3.png'),
	fingerprint : require('../assets/images/hero/fingerprint.png'),
	mappingSales : require('../assets/images/pattern/mapping.jpg'),
	mapsIcon : require('../assets/images/pattern/maps_icon.png'),
	qrcode : require('../assets/images/global/icons/qrcode.png'),
	personal : require('../assets/images/global/icons/personal.png'),
}

export const ICONS = {
	user : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
	lock : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5 12C4.44772 12 4 12.4477 4 13V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V13C20 12.4477 19.5523 12 19 12H5ZM2 13C2 11.3431 3.34315 10 5 10H19C20.6569 10 22 11.3431 22 13V20C22 21.6569 20.6569 23 19 23H5C3.34315 23 2 21.6569 2 20V13Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3C10.9391 3 9.92172 3.42143 9.17157 4.17157C8.42143 4.92172 8 5.93913 8 7V11C8 11.5523 7.55228 12 7 12C6.44772 12 6 11.5523 6 11V7C6 5.4087 6.63214 3.88258 7.75736 2.75736C8.88258 1.63214 10.4087 1 12 1C13.5913 1 15.1174 1.63214 16.2426 2.75736C17.3679 3.88258 18 5.4087 18 7V11C18 11.5523 17.5523 12 17 12C16.4477 12 16 11.5523 16 11V7C16 5.93913 15.5786 4.92172 14.8284 4.17157C14.0783 3.42143 13.0609 3 12 3Z" fill="white"/></svg>`,
	eyeOpen : `<svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.8475 7.43335C23.6331 7.1411 18.5245 0.277466 11.9999 0.277466C5.47529 0.277466 0.366469 7.1411 0.152297 7.43307C-0.0507657 7.71032 -0.0507657 8.08637 0.152297 8.36362C0.366469 8.65587 5.47529 15.5195 11.9999 15.5195C18.5245 15.5195 23.6331 8.65582 23.8475 8.36386C24.0508 8.08665 24.0508 7.71032 23.8475 7.43335ZM11.9999 13.9427C7.19382 13.9427 3.03127 9.38722 1.79907 7.89795C3.02968 6.40737 7.18351 1.85422 11.9999 1.85422C16.8057 1.85422 20.968 6.40896 22.2007 7.89902C20.9701 9.38955 16.8162 13.9427 11.9999 13.9427Z" fill="#FE9063"/><path d="M11.9998 3.16821C9.38224 3.16821 7.25256 5.29005 7.25256 7.89801C7.25256 10.506 9.38224 12.6278 11.9998 12.6278C14.6174 12.6278 16.7471 10.506 16.7471 7.89801C16.7471 5.29005 14.6174 3.16821 11.9998 3.16821ZM11.9998 11.0512C10.2547 11.0512 8.83502 9.6367 8.83502 7.89801C8.83502 6.15932 10.2547 4.74484 11.9998 4.74484C13.7449 4.74484 15.1646 6.15932 15.1646 7.89801C15.1646 9.6367 13.745 11.0512 11.9998 11.0512Z" fill="#FE9063"/></svg>`,
	eyeClose : `<svg width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.8475 10.4333C23.6331 10.1411 18.5245 3.27747 11.9999 3.27747C5.47529 3.27747 0.366469 10.1411 0.152297 10.4331C-0.0507657 10.7103 -0.0507657 11.0864 0.152297 11.3636C0.366469 11.6559 5.47529 18.5195 11.9999 18.5195C18.5245 18.5195 23.6331 11.6558 23.8475 11.3639C24.0508 11.0866 24.0508 10.7103 23.8475 10.4333ZM11.9999 16.9427C7.19382 16.9427 3.03127 12.3872 1.79907 10.8979C3.02968 9.40737 7.18351 4.85422 11.9999 4.85422C16.8057 4.85422 20.968 9.40896 22.2007 10.899C20.9701 12.3896 16.8162 16.9427 11.9999 16.9427Z" fill="#FE9063"/><path d="M11.9998 6.16821C9.38224 6.16821 7.25256 8.29005 7.25256 10.898C7.25256 13.506 9.38224 15.6278 11.9998 15.6278C14.6174 15.6278 16.7471 13.506 16.7471 10.898C16.7471 8.29005 14.6174 6.16821 11.9998 6.16821ZM11.9998 14.0512C10.2547 14.0512 8.83502 12.6367 8.83502 10.898C8.83502 9.15932 10.2547 7.74484 11.9998 7.74484C13.7449 7.74484 15.1646 9.15932 15.1646 10.898C15.1646 12.6367 13.745 14.0512 11.9998 14.0512Z" fill="#FE9063"/><path d="M5 1L18.5 20" stroke="#FE9063" stroke-width="2"/></svg>`,
	
}

const appTheme = {COLORS, SIZES, FONTS, IMAGES}

export default appTheme;