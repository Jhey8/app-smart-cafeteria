import { Tabs } from "expo-router";
import { View } from "react-native";
import { Avatar } from "@/componentes/Avatar";
import { BarraDePestanas } from "@/componentes/BarraDePestanas";
import { Icono } from "@/componentes/Icono";
import { useCuenta } from "@/estado/cuenta";
import { useSesion } from "@/estado/sesion";
import { colores } from "@/tema";

export default function Pestanas() {
    return (
        <Tabs
            tabBar={(props) => <BarraDePestanas {...props} />}
            screenOptions={{
                headerStyle: { backgroundColor: colores.superficie },
                headerShadowVisible: false,
                headerTitleStyle: { color: colores.texto, fontWeight: "700" },
                sceneStyle: { backgroundColor: colores.fondo },
            }}
        >
            <Tabs.Screen name="index" options={{ title: "Inicio", headerShown: false, tabBarIcon: ({ color }) => <Icono nombre="inicio" color={color} /> }} />
            <Tabs.Screen
                name="menu"
                options={{ title: "Menú de hoy", tabBarLabel: "Menú", tabBarIcon: ({ color }) => <Icono nombre="menu" color={color} /> }}
            />
            <Tabs.Screen
                name="pedidos"
                options={{ title: "Mis pedidos", tabBarLabel: "Pedidos", tabBarIcon: ({ color }) => <Icono nombre="pedidos" color={color} /> }}
            />
            <Tabs.Screen
                name="cuenta"
                options={{
                    title: "Mi perfil",
                    tabBarLabel: "Tú",
                    headerShown: false,
                    sceneStyle: { backgroundColor: colores.superficie },
                    tabBarIcon: ({ focused }) => <IconoDeCuenta enfocada={focused} />,
                }}
            />
        </Tabs>
    );
}

/** La pestaña de la cuenta lleva la foto de la persona, como en WhatsApp; con un aro azul cuando está activa. */
function IconoDeCuenta({ enfocada }: { enfocada: boolean }) {
    const { sesion } = useSesion();
    const { cuenta } = useCuenta();
    return (
        <View style={{ borderRadius: 16, borderWidth: 2, borderColor: enfocada ? colores.acento : "transparent", padding: 1 }}>
            <Avatar nombres={cuenta?.nombres ?? sesion?.nombres ?? ""} apellidos={cuenta?.apellidos ?? sesion?.apellidos ?? ""} fotoUrl={cuenta?.fotoUrl} tamano={24} />
        </View>
    );
}
