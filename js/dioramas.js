// DIORAMAS - 17 Sektor Ekonomi Indonesia
// Setiap diorama adalah visualisasi 3D prosedural yang mewakili satu lapangan usaha

const SECTOR_DIORAMAS = {
    'A Pertanian, Kehutanan dan Perikanan': {
        name: 'Pertanian, Kehutanan & Perikanan',
        icon: '🌾',
        color: 0x2d5016,
        build: (scene) => {
            const group = new THREE.Group();

            // Tanah/ground
            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d6b1f });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Pohon 1
            const tree1 = buildTree(0x8B4513, 0x228B22);
            tree1.position.set(-2, 0, -1);
            group.add(tree1);

            // Pohon 2
            const tree2 = buildTree(0x654321, 0x32CD32);
            tree2.position.set(2, 0, 2);
            tree2.scale.set(0.8, 0.8, 0.8);
            group.add(tree2);

            // Sawah (water plane)
            const waterGeom = new THREE.PlaneGeometry(3, 3);
            const waterMat = new THREE.MeshLambertMaterial({ color: 0x1e90ff, wireframe: false });
            const water = new THREE.Mesh(waterGeom, waterMat);
            water.rotation.x = -Math.PI / 2;
            water.position.set(-3, 0.05, 0);
            water.receiveShadow = true;
            group.add(water);

            // Animasi (swaying trees)
            group.userData.animate = (time) => {
                tree1.rotation.z = Math.sin(time * 0.5) * 0.05;
                tree2.rotation.z = Math.cos(time * 0.5) * 0.05;
            };

            return group;
        }
    },
    'B Pertambangan dan Penggalian': {
        name: 'Pertambangan & Penggalian',
        icon: '⛏️',
        color: 0x4a4a4a,
        build: (scene) => {
            const group = new THREE.Group();

            // Mine ground (dark rock)
            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Rock formations
            const rock1 = buildRock(0.6, 0.5, 0.4);
            rock1.position.set(-2, 0.2, 0);
            group.add(rock1);

            const rock2 = buildRock(0.4, 0.3, 0.3);
            rock2.position.set(1.5, 0.15, 1.5);
            group.add(rock2);

            // Excavator arm (simplified)
            const armBase = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 1, 0.5),
                new THREE.MeshLambertMaterial({ color: 0xFFD700 })
            );
            armBase.position.set(2, 0.5, -2);
            group.add(armBase);

            // Bucket
            const bucket = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.3, 0.4),
                new THREE.MeshLambertMaterial({ color: 0xFF8C00 })
            );
            bucket.position.set(2.5, 0.8, -2);
            group.add(bucket);

            group.userData.animate = (time) => {
                armBase.rotation.z = Math.sin(time * 0.3) * 0.3;
                bucket.position.y = 0.8 + Math.sin(time * 0.3) * 0.2;
            };

            return group;
        }
    },
    'C Industri Pengolahan': {
        name: 'Industri Pengolahan',
        icon: '🏭',
        color: 0x696969,
        build: (scene) => {
            const group = new THREE.Group();

            // Factory ground
            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Factory building 1
            const factory1 = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1.5, 1.5),
                new THREE.MeshLambertMaterial({ color: 0x8B7355 })
            );
            factory1.position.set(-2, 0.75, 0);
            group.add(factory1);

            // Chimney 1
            const chimney1 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.2, 1, 8),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            chimney1.position.set(-2, 2, 0);
            group.add(chimney1);

            // Factory building 2
            const factory2 = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 1.2, 1),
                new THREE.MeshLambertMaterial({ color: 0x696969 })
            );
            factory2.position.set(2, 0.6, -1.5);
            group.add(factory2);

            // Chimney 2
            const chimney2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.18, 0.8, 8),
                new THREE.MeshLambertMaterial({ color: 0x404040 })
            );
            chimney2.position.set(2, 1.8, -1.5);
            group.add(chimney2);

            // Smoke effect (animated boxes)
            group.userData.animate = (time) => {
                chimney1.rotation.z = Math.sin(time * 0.8) * 0.02;
                chimney2.rotation.z = Math.cos(time * 0.8) * 0.02;
            };

            return group;
        }
    },
    'D Pengadaan Listrik dan Gas': {
        name: 'Listrik & Gas',
        icon: '⚡',
        color: 0xFFD700,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Power tower
            const tower = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 2, 0.2),
                new THREE.MeshLambertMaterial({ color: 0xFF6347 })
            );
            tower.position.set(-2, 1, 0);
            group.add(tower);

            // Power lines (simplified)
            for (let i = 0; i < 3; i++) {
                const lineGeom = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    -2, 1.5, i - 1,
                    2, 1.3, i - 1
                ]);
                lineGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                const lineMat = new THREE.LineBasicMaterial({ color: 0xFFD700, linewidth: 2 });
                const line = new THREE.Line(lineGeom, lineMat);
                group.add(line);
            }

            // Generator (rotating cylinder)
            const generator = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16),
                new THREE.MeshLambertMaterial({ color: 0x4169E1 })
            );
            generator.position.set(2, 0.4, 0);
            group.add(generator);

            group.userData.animate = (time) => {
                generator.rotation.z += 0.05;
            };

            return group;
        }
    },
    'E Air Minum, Pengelolaan Limbah dan Daur Ulang': {
        name: 'Air & Limbah',
        icon: '💧',
        color: 0x00BFFF,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x7F7F7F });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Water tank 1
            const tank1 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16),
                new THREE.MeshLambertMaterial({ color: 0x00BFFF })
            );
            tank1.position.set(-1.5, 0.6, 0);
            group.add(tank1);

            // Water tank 2
            const tank2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
                new THREE.MeshLambertMaterial({ color: 0x1E90FF })
            );
            tank2.position.set(1.5, 0.5, 0);
            group.add(tank2);

            // Pump
            const pump = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.5, 0.3),
                new THREE.MeshLambertMaterial({ color: 0xFF4500 })
            );
            pump.position.set(0, 0.25, 1.5);
            group.add(pump);

            // Pipes (simplified)
            const pipeGeom = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
            const pipeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const pipe = new THREE.Mesh(pipeGeom, pipeMat);
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(0, 0.8, 0);
            group.add(pipe);

            group.userData.animate = (time) => {
                pump.rotation.z += 0.08;
            };

            return group;
        }
    },
    'F Konstruksi': {
        name: 'Konstruksi',
        icon: '🏗️',
        color: 0xD2B48C,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Building under construction
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1.2, 1),
                new THREE.MeshLambertMaterial({ color: 0xCD853F })
            );
            building.position.set(-1.5, 0.6, 0);
            group.add(building);

            // Crane tower
            const craneBase = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 1.5, 0.2),
                new THREE.MeshLambertMaterial({ color: 0xFF6347 })
            );
            craneBase.position.set(1.5, 0.75, 0);
            group.add(craneBase);

            // Crane arm
            const craneArm = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.1, 0.1),
                new THREE.MeshLambertMaterial({ color: 0xFF6347 })
            );
            craneArm.position.set(1.5, 1.8, 0);
            group.add(craneArm);

            // Crane hook
            const hook = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                new THREE.MeshLambertMaterial({ color: 0xFFD700 })
            );
            hook.position.set(2.5, 1.3, 0);
            group.add(hook);

            group.userData.animate = (time) => {
                craneArm.rotation.y = Math.sin(time * 0.4) * 0.3;
                hook.position.y = 1.3 - Math.abs(Math.sin(time * 0.4)) * 0.4;
            };

            return group;
        }
    },
    'G Perdagangan Besar, Eceran, Reparasi Mobil & Motor': {
        name: 'Perdagangan',
        icon: '🛍️',
        color: 0xFF1493,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Store 1
            const store1 = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1, 1.5),
                new THREE.MeshLambertMaterial({ color: 0xFF69B4 })
            );
            store1.position.set(-2, 0.5, 0);
            group.add(store1);

            // Store window
            const window1 = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.6, 0.05),
                new THREE.MeshLambertMaterial({ color: 0x87CEEB })
            );
            window1.position.set(-2, 0.7, 0.76);
            group.add(window1);

            // Store 2
            const store2 = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.8, 1.2),
                new THREE.MeshLambertMaterial({ color: 0xFF1493 })
            );
            store2.position.set(1.5, 0.4, 1.5);
            group.add(store2);

            // Shelves (stacked boxes)
            for (let i = 0; i < 3; i++) {
                const shelf = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.2, 0.5),
                    new THREE.MeshLambertMaterial({ color: 0xB8860B })
                );
                shelf.position.set(2, 0.3 + i * 0.3, 0);
                group.add(shelf);
            }

            return group;
        }
    },
    'H Transportasi dan Pergudangan': {
        name: 'Transportasi & Pergudangan',
        icon: '🚚',
        color: 0xFF8C00,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Truck
            const truckBody = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.6, 0.8),
                new THREE.MeshLambertMaterial({ color: 0xFF8C00 })
            );
            truckBody.position.set(-1, 0.3, 0);
            group.add(truckBody);

            const truckCab = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.5, 0.6),
                new THREE.MeshLambertMaterial({ color: 0xFF4500 })
            );
            truckCab.position.set(-1.6, 0.35, 0);
            group.add(truckCab);

            // Wheels
            for (let i = 0; i < 2; i++) {
                const wheel = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16),
                    new THREE.MeshLambertMaterial({ color: 0x000000 })
                );
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(-1.2 + i * 1.2, 0.1, -0.45);
                group.add(wheel);
            }

            // Warehouse
            const warehouse = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.5, 1.5),
                new THREE.MeshLambertMaterial({ color: 0x8B7355 })
            );
            warehouse.position.set(2, 0.75, 1);
            group.add(warehouse);

            group.userData.animate = (time) => {
                truckBody.position.x = -1 + Math.sin(time * 0.3) * 0.5;
            };

            return group;
        }
    },
    'I Akomodasi dan Penyediaan Makan Minum': {
        name: 'Akomodasi & Makanan',
        icon: '🏨',
        color: 0xFF69B4,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Hotel building
            const hotel = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1.8, 1),
                new THREE.MeshLambertMaterial({ color: 0xFF69B4 })
            );
            hotel.position.set(-1.5, 0.9, 0);
            group.add(hotel);

            // Windows
            for (let x = -0.5; x < 1; x += 0.5) {
                for (let y = 0.3; y < 1.5; y += 0.4) {
                    const window = new THREE.Mesh(
                        new THREE.BoxGeometry(0.25, 0.25, 0.05),
                        new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
                    );
                    window.position.set(-1.5 + x, y, 0.51);
                    group.add(window);
                }
            }

            // Restaurant
            const restaurant = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.8, 1.2),
                new THREE.MeshLambertMaterial({ color: 0xFF4500 })
            );
            restaurant.position.set(1.5, 0.4, 0);
            group.add(restaurant);

            // Tables (simplified)
            for (let i = 0; i < 3; i++) {
                const table = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8),
                    new THREE.MeshLambertMaterial({ color: 0x8B4513 })
                );
                table.position.set(1.5, 0.7, -0.5 + i * 0.5);
                group.add(table);
            }

            return group;
        }
    },
    'J Informasi dan Komunikasi': {
        name: 'Informasi & Komunikasi',
        icon: '📱',
        color: 0x4169E1,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Server towers
            for (let i = 0; i < 3; i++) {
                const server = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 1.5, 0.5),
                    new THREE.MeshLambertMaterial({ color: 0x4169E1 })
                );
                server.position.set(-2 + i * 1.5, 0.75, -1.5);
                group.add(server);

                // Lights
                const light = new THREE.Mesh(
                    new THREE.BoxGeometry(0.4, 0.1, 0.4),
                    new THREE.MeshLambertMaterial({ color: 0x00FF00 })
                );
                light.position.set(-2 + i * 1.5, 1.3, -1.5);
                group.add(light);
            }

            // Antenna/satellite dish
            const dish = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 16, 16),
                new THREE.MeshLambertMaterial({ color: 0xFFD700 })
            );
            dish.scale.set(1, 0.4, 1);
            dish.position.set(2, 1.2, 1.5);
            group.add(dish);

            // Antenna pole
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
                new THREE.MeshLambertMaterial({ color: 0x696969 })
            );
            pole.position.set(2, 0.5, 1.5);
            group.add(pole);

            group.userData.animate = (time) => {
                dish.rotation.y += 0.02;
            };

            return group;
        }
    },
    'K Jasa Keuangan dan Asuransi': {
        name: 'Keuangan & Asuransi',
        icon: '💰',
        color: 0xFFD700,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Bank building
            const bank = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 1.5),
                new THREE.MeshLambertMaterial({ color: 0xFFD700 })
            );
            bank.position.set(-1, 1, 0);
            group.add(bank);

            // Columns
            for (let i = 0; i < 4; i++) {
                const column = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.15, 0.15, 2, 8),
                    new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
                );
                column.position.set(-2 + i * 1.3, 1, 0.8);
                group.add(column);
            }

            // Vault door
            const vault = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.8, 0.1),
                new THREE.MeshLambertMaterial({ color: 0x8B4513 })
            );
            vault.position.set(-1, 0.8, 0.76);
            group.add(vault);

            // Coins (stacked)
            for (let i = 0; i < 3; i++) {
                const coin = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16),
                    new THREE.MeshLambertMaterial({ color: 0xFFD700 })
                );
                coin.position.set(2, 0.1 + i * 0.08, 0);
                group.add(coin);
            }

            return group;
        }
    },
    'L Real Estat': {
        name: 'Real Estat',
        icon: '🏢',
        color: 0x8B4513,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Office buildings
            for (let i = 0; i < 2; i++) {
                const building = new THREE.Mesh(
                    new THREE.BoxGeometry(1.2, 2, 1),
                    new THREE.MeshLambertMaterial({ color: 0x8B4513 })
                );
                building.position.set(-1.5 + i * 3, 1, 0);
                group.add(building);

                // Windows
                for (let x = -0.4; x < 0.5; x += 0.4) {
                    for (let y = 0.2; y < 1.8; y += 0.3) {
                        const window = new THREE.Mesh(
                            new THREE.BoxGeometry(0.2, 0.2, 0.05),
                            new THREE.MeshLambertMaterial({ color: 0x87CEEB })
                        );
                        window.position.set(-1.5 + i * 3 + x, y, 0.51);
                        group.add(window);
                    }
                }
            }

            // "For Sale" sign
            const sign = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.3, 0.05),
                new THREE.MeshLambertMaterial({ color: 0xFF0000 })
            );
            sign.position.set(0, 1, 2);
            group.add(sign);

            return group;
        }
    },
    'M Jasa Profesional, Ilmiah dan Teknis': {
        name: 'Jasa Profesional',
        icon: '👔',
        color: 0x4169E1,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Office desks
            for (let i = 0; i < 3; i++) {
                const desk = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.3, 0.5),
                    new THREE.MeshLambertMaterial({ color: 0x8B4513 })
                );
                desk.position.set(-1.5 + i * 1.5, 0.15, 0);
                group.add(desk);

                // Chairs
                const chair = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8),
                    new THREE.MeshLambertMaterial({ color: 0x0000CD })
                );
                chair.position.set(-1.5 + i * 1.5, 0.4, -0.7);
                group.add(chair);
            }

            // Whiteboard
            const whiteboard = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1, 0.05),
                new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
            );
            whiteboard.position.set(0, 1, 1.5);
            group.add(whiteboard);

            return group;
        }
    },
    'N Jasa Administrasi dan Pendukung Usaha Lainnya': {
        name: 'Jasa Administrasi',
        icon: '📋',
        color: 0x696969,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0xD3D3D3 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Filing cabinets
            for (let i = 0; i < 4; i++) {
                const cabinet = new THREE.Mesh(
                    new THREE.BoxGeometry(0.4, 1, 0.4),
                    new THREE.MeshLambertMaterial({ color: 0x696969 })
                );
                cabinet.position.set(-1.5 + i * 1, 0.5, 0);
                group.add(cabinet);
            }

            // Printer
            const printer = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.4, 0.8),
                new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
            );
            printer.position.set(2, 0.2, 0);
            group.add(printer);

            // Papers
            const papers = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.1),
                new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
            );
            papers.position.set(2, 0.6, 0);
            group.add(papers);

            return group;
        }
    },
    'O Administrasi Publik, Pertahanan dan Jaminan Sosial Wajib': {
        name: 'Admin Publik & Pertahanan',
        icon: '🏛️',
        color: 0x8B0000,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Government building
            const gov = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 1.5),
                new THREE.MeshLambertMaterial({ color: 0x8B0000 })
            );
            gov.position.set(-1, 1, 0);
            group.add(gov);

            // Dome
            const dome = new THREE.Mesh(
                new THREE.SphereGeometry(1, 16, 16),
                new THREE.MeshLambertMaterial({ color: 0xFFD700 })
            );
            dome.scale.set(1, 0.6, 1);
            dome.position.set(-1, 2.3, 0);
            group.add(dome);

            // Flag pole
            const flagPole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8),
                new THREE.MeshLambertMaterial({ color: 0x696969 })
            );
            flagPole.position.set(0, 2.2, 0.76);
            group.add(flagPole);

            // Flag
            const flag = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.4, 0.05),
                new THREE.MeshLambertMaterial({ color: 0xFF0000 })
            );
            flag.position.set(0.4, 2.8, 0.76);
            group.add(flag);

            return group;
        }
    },
    'P Pendidikan': {
        name: 'Pendidikan',
        icon: '🎓',
        color: 0x228B22,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // School building
            const school = new THREE.Mesh(
                new THREE.BoxGeometry(1.8, 1.5, 1.2),
                new THREE.MeshLambertMaterial({ color: 0xFF6347 })
            );
            school.position.set(-1, 0.75, 0);
            group.add(school);

            // Roof
            const roofGeom = new THREE.ConeGeometry(1.3, 0.6, 4);
            const roofMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.set(-1, 1.5, 0);
            group.add(roof);

            // Windows
            for (let x = -0.6; x < 0.8; x += 0.5) {
                for (let y = 0.3; y < 1.2; y += 0.4) {
                    const window = new THREE.Mesh(
                        new THREE.BoxGeometry(0.25, 0.25, 0.05),
                        new THREE.MeshLambertMaterial({ color: 0x87CEEB })
                    );
                    window.position.set(-1 + x, y, 0.61);
                    group.add(window);
                }
            }

            // Flagpole with flag
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8),
                new THREE.MeshLambertMaterial({ color: 0x696969 })
            );
            pole.position.set(1.2, 0.6, 0);
            group.add(pole);

            const flag = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.3, 0.05),
                new THREE.MeshLambertMaterial({ color: 0xFF0000 })
            );
            flag.position.set(1.5, 1.1, 0);
            group.add(flag);

            return group;
        }
    },
    'Q Jasa Kesehatan': {
        name: 'Jasa Kesehatan',
        icon: '⚕️',
        color: 0x00DD00,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Hospital building
            const hospital = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.8, 1.2),
                new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
            );
            hospital.position.set(-0.5, 0.9, 0);
            group.add(hospital);

            // Red cross on roof
            const crossH = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.1, 0.1),
                new THREE.MeshLambertMaterial({ color: 0xFF0000 })
            );
            crossH.position.set(-0.5, 1.9, 0);
            group.add(crossH);

            const crossV = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.6, 0.1),
                new THREE.MeshLambertMaterial({ color: 0xFF0000 })
            );
            crossV.position.set(-0.5, 1.9, 0);
            group.add(crossV);

            // Ambulance
            const ambulance = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.6, 0.6),
                new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
            );
            ambulance.position.set(2, 0.3, 0);
            group.add(ambulance);

            // Ambulance red stripe
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.15, 0.05),
                new THREE.MeshLambertMaterial({ color: 0xFF0000 })
            );
            stripe.position.set(2, 0.5, 0.31);
            group.add(stripe);

            return group;
        }
    },
    'R Kesenian, Hiburan dan Rekreasi': {
        name: 'Seni, Hiburan & Rekreasi',
        icon: '🎭',
        color: 0xFF1493,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Stage
            const stage = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.2, 1.5),
                new THREE.MeshLambertMaterial({ color: 0xFF6347 })
            );
            stage.position.set(-1, 0.1, 0);
            group.add(stage);

            // Stage lights
            for (let i = 0; i < 3; i++) {
                const light = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 8, 8),
                    new THREE.MeshLambertMaterial({ color: 0xFFFF00 })
                );
                light.position.set(-1.5 + i * 1.5, 1.5, 1.5);
                group.add(light);
            }

            // Cinema screen
            const screen = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1, 0.05),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            screen.position.set(2, 0.8, 0);
            group.add(screen);

            return group;
        }
    },
    'S Jasa Perorangan Lainnya': {
        name: 'Jasa Perorangan Lain',
        icon: '🤝',
        color: 0x9932CC,
        build: (scene) => {
            const group = new THREE.Group();

            const groundGeom = new THREE.PlaneGeometry(8, 8);
            const groundMat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            group.add(ground);

            // Salon/barber chair
            const chair = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8),
                new THREE.MeshLambertMaterial({ color: 0x8B0000 })
            );
            chair.position.set(-1.5, 0.4, 0);
            group.add(chair);

            // Mirror
            const mirror = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 1.2, 0.05),
                new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
            );
            mirror.position.set(-1.5, 0.8, 0.5);
            group.add(mirror);

            // Laundry
            const washer = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 0.6, 8),
                new THREE.MeshLambertMaterial({ color: 0x696969 })
            );
            washer.position.set(1.5, 0.3, 0);
            group.add(washer);

            // Dryer
            const dryer = new THREE.Mesh(
                new THREE.CylinderGeometry(0.45, 0.45, 0.6, 8),
                new THREE.MeshLambertMaterial({ color: 0x505050 })
            );
            dryer.position.set(1.5, 0.3, 1);
            group.add(dryer);

            group.userData.animate = (time) => {
                washer.rotation.y += 0.06;
                dryer.rotation.y += 0.05;
            };

            return group;
        }
    }
};

// Helper functions untuk build geometry

function buildTree(trunkColor, foliageColor) {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 1, 8),
        new THREE.MeshLambertMaterial({ color: trunkColor })
    );
    trunk.position.y = 0.5;
    group.add(trunk);

    const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshLambertMaterial({ color: foliageColor })
    );
    foliage.position.y = 1.2;
    group.add(foliage);

    return group;
}

function buildRock(w, h, d) {
    return new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color: 0x696969 })
    );
}

export { SECTOR_DIORAMAS };
